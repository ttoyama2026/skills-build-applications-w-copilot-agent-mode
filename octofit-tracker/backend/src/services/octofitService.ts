import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity requires userId, teamId, type, and minutes'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;

  if (typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
    throw Object.assign(new Error('userId must be a valid ObjectId'), { status: 400 });
  }
  if (typeof teamId !== 'string' || !mongoose.Types.ObjectId.isValid(teamId)) {
    throw Object.assign(new Error('teamId must be a valid ObjectId'), { status: 400 });
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw Object.assign(new Error('type is required'), { status: 400 });
  }

  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw Object.assign(new Error('minutes must be a positive number'), { status: 400 });
  }

  const user = await User.findById(userId);
  const team = await Team.findById(teamId);
  if (!user || !team) {
    throw Object.assign(new Error('userId and teamId must reference existing records'), { status: 400 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: Math.max(Math.round(minutes), 1),
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team requires a name and mascot'), { status: 400 });
  }

  const { name, mascot, members } = input as Record<string, unknown>;

  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('name is required'), { status: 400 });
  }
  if (mascot !== undefined && (typeof mascot !== 'string' || !mascot.trim())) {
    throw Object.assign(new Error('mascot must be a non-empty string when provided'), { status: 400 });
  }

  if (members !== undefined && !Array.isArray(members)) {
    throw Object.assign(new Error('members must be an array of ObjectId strings'), { status: 400 });
  }

  const normalizedMembers = members ?? [];
  const memberObjectIds = normalizedMembers.map((memberId) => {
    if (typeof memberId !== 'string' || !mongoose.Types.ObjectId.isValid(memberId)) {
      throw Object.assign(new Error('members must be valid ObjectId strings'), { status: 400 });
    }
    return new mongoose.Types.ObjectId(memberId);
  });

  const uniqueMemberIds = new Set(memberObjectIds.map((memberId) => memberId.toString()));
  const existingMemberCount = await User.countDocuments({ _id: { $in: memberObjectIds } });
  if (existingMemberCount !== uniqueMemberIds.size) {
    throw Object.assign(new Error('members must reference existing users'), { status: 400 });
  }

  return Team.create({
    name: name.trim(),
    ...(mascot === undefined ? {} : { mascot: mascot.trim() }),
    members: memberObjectIds,
  });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));

  return teams
    .map((team) => ({
      teamId: team._id.toString(),
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();

  let preferredFocus = user.fitnessGoal;
  let selectionReason: (workoutFocus: string) => string = (workoutFocus) =>
    `Because your fitness goal is ${user.fitnessGoal}, this workout focuses on ${workoutFocus} training.`;
  if (recentActivity.length > 0) {
    const activityTypes = recentActivity.map((activity) => activity.type).filter(Boolean);
    const primaryType = activityTypes[0];
    if (primaryType) {
      preferredFocus = primaryType === 'run' ? 'endurance' : primaryType;
      selectionReason = (workoutFocus) =>
        `Because your recent ${primaryType} activity suggests ${workoutFocus} training.`;
    }
  }

  const matches = await Workout.find({ focus: preferredFocus }).lean();
  if (matches.length === 0) {
    return [];
  }

  return matches.slice(0, 3).map((workout) => ({
    ...workout,
    reason: selectionReason(workout.focus),
  }));
}

export { User };
