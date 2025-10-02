import { ObjectId } from "mongodb";

export const collection_name = "candidates";

export const schema = {
  position_id: { type: "number", required: true },
  candidate_number: { type: "number", required: true },
  period_start: { type: "number", required: true },
  period_end: { type: "number", required: true },
  user_id: { type: "objectId", required: true },
  name: { type: "string", required: true },
  image: { type: "string", default: "/candidate/default.png" },
  profile: { type: "string", required: true },
  vision_mission: {
    type: "object",
    properties: {
      vision: { type: "string" },
      mission: { type: "string" },
    },
  },
  program_kerja: { type: "string" },
  status: { type: "string", enum: ["active", "inactive"], default: "active" },
  created_at: { type: "date", auto: true },
  updated_at: { type: "date" },
  deleted_at: { type: "date" },
};

export const indexes = [
  {
    key: {
      position_id: 1,
      candidate_number: 1,
      period_start: 1,
      period_end: 1,
    },
    unique: true,
  },
  { key: { user_id: 1 } },
  { key: { deleted_at: 1 } },
  { key: { status: 1 } },
  { key: { period_start: 1, period_end: 1 } },
];

export function validateCandidate(data) {
  const errors = [];

  if (!data.position_id || typeof data.position_id !== "number") {
    errors.push("Position ID is required and must be a number");
  }

  if (!data.candidate_number || typeof data.candidate_number !== "number") {
    errors.push("Candidate number is required and must be a number");
  }

  if (!data.period_start || typeof data.period_start !== "number") {
    errors.push("Period start is required and must be a number");
  }

  if (!data.period_end || typeof data.period_end !== "number") {
    errors.push("Period end is required and must be a number");
  }

  if (!data.user_id) {
    errors.push("User ID is required");
  } else {
    try {
      new ObjectId(data.user_id);
    } catch (e) {
      errors.push("User ID must be a valid ObjectId");
    }
  }

  if (!data.name || typeof data.name !== "string") {
    errors.push("Name is required and must be a string");
  }

  if (data.status && !["active", "inactive"].includes(data.status)) {
    errors.push('Status must be either "active" or "inactive"');
  }

  if (
    data.period_start &&
    data.period_end &&
    data.period_start >= data.period_end
  ) {
    errors.push("Period start must be less than period end");
  }

  // Validate vision_mission structure if provided
  if (data.vision_mission) {
    if (
      typeof data.vision_mission !== "object" ||
      Array.isArray(data.vision_mission)
    ) {
      errors.push("Vision mission must be an object");
    } else {
      if (
        data.vision_mission.vision &&
        typeof data.vision_mission.vision !== "string"
      ) {
        errors.push("Vision must be a string");
      }
      if (
        data.vision_mission.mission &&
        typeof data.vision_mission.mission !== "string"
      ) {
        errors.push("Mission must be a string");
      }
    }
  }

  return errors;
}

export const searchableFields = ["name", "profile", "program_kerja", "status"];
