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

  const duration = Number(minutes);
  if (!Number.isFinite(duration) || duration <= 0) {
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
    minutes: duration,
    points: Math.max(Math.round(duration), 1),
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
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('mascot is required'), { status: 400 });
  }

  const normalizedMembers = Array.isArray(members) ? members : [];
  for (const memberId of normalizedMembers) {
    if (typeof memberId !== 'string' || !mongoose.Types.ObjectId.isValid(memberId)) {
      throw Object.assign(new Error('members must be valid ObjectId strings'), { status: 400 });
    }
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: normalizedMembers.map((memberId) => new mongoose.Types.ObjectId(memberId)),
  });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1 } },
  ]);

  if (totals.length === 0) {
    return [];
  }

  const teamIds = totals.map(({ _id }) => _id);
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamMap = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals.map((entry, index) => ({
    teamId: entry._id.toString(),
    teamName: teamMap.get(entry._id.toString()) ?? 'Unknown team',
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();

  let preferredFocus = user.fitnessGoal;
  if (recentActivity.length > 0) {
    const activityTypes = recentActivity.map((activity) => activity.type).filter(Boolean);
    const primaryType = activityTypes[0];
    if (primaryType) {
      preferredFocus = primaryType === 'run' ? 'endurance' : primaryType;
    }
  }

  const matches = await Workout.find({ focus: preferredFocus }).lean();
  if (matches.length === 0) {
    const fallback = await Workout.find().limit(3).lean();
    return fallback.map((workout) => ({
      ...workout,
      reason: `Suggested for ${user.name || user.email} based on your recent activity and goal.`,
    }));
  }

  return matches.slice(0, 3).map((workout) => ({
    ...workout,
    reason: `Because your recent activity and goal align with ${workout.focus} training.`,
  }));
}

export { User };
