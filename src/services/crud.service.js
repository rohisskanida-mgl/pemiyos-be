import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { getDatabase } from "../config/database.js";

// Import all models to get their searchable fields and validation functions
import * as usersModel from "../models/users.model.js";
import * as positionsModel from "../models/positions.model.js";
import * as candidatesModel from "../models/candidates.model.js";
import * as votesModel from "../models/votes.model.js";
import * as electionsModel from "../models/elections.model.js";

const models = {
  users: usersModel,
  positions: positionsModel,
  candidates: candidatesModel,
  votes: votesModel,
  elections: electionsModel,
};

function getModel(collection_name) {
  const model = models[collection_name];
  if (!model) {
    throw new Error(`Model for collection '${collection_name}' not found`);
  }
  return model;
}

function buildSearchQuery(collection_name, search) {
  if (!search) return {};

  const model = getModel(collection_name);
  const searchableFields = model.searchableFields || [];

  if (searchableFields.length === 0) return {};

  const searchRegex = { $regex: search, $options: "i" };
  return {
    $or: searchableFields.map((field) => ({ [field]: searchRegex })),
  };
}

function addTimestamps(data, isUpdate = false) {
  const now = new Date();

  if (!isUpdate) {
    data.created_at = now;
  }
  data.updated_at = now;

  return data;
}

function convertObjectIds(data) {
  const converted = { ...data };

  // Convert string IDs to ObjectId for fields ending with '_id' (except position_id)
  Object.keys(converted).forEach((key) => {
    if (
      key.endsWith("_id") &&
      key !== "position_id" &&
      typeof converted[key] === "string"
    ) {
      try {
        converted[key] = new ObjectId(converted[key]);
      } catch (e) {
        // Keep as string if conversion fails
      }
    }
  });

  return converted;
}

async function populateRelations(collection_name, documents) {
  if (!Array.isArray(documents) || documents.length === 0) return documents;

  const model = getModel(collection_name);
  const schema = model.schema;

  // Identify fields that should be populated (both ObjectId and numeric references)
  const relationFields = [];
  Object.keys(schema).forEach((field) => {
    if (field.endsWith("_id")) {
      const fieldType = schema[field].type;

      // Handle ObjectId references
      if (fieldType === "objectId") {
        let relatedCollection = field.slice(0, -3); // Remove '_id'

        // Add 's' for pluralization
        if (!relatedCollection.endsWith("s")) {
          relatedCollection += "s";
        }

        relationFields.push({
          field,
          relatedCollection,
          isObjectId: true,
        });
      }

      // Handle numeric references (like position_id)
      if (fieldType === "number") {
        let relatedCollection = field.slice(0, -3); // Remove '_id'

        // Add 's' for pluralization
        if (!relatedCollection.endsWith("s")) {
          relatedCollection += "s";
        }

        relationFields.push({
          field,
          relatedCollection,
          isObjectId: false,
        });
      }
    }
  });

  if (relationFields.length === 0) return documents;

  // For each document, populate its relations
  const populatedDocuments = await Promise.all(
    documents.map(async (doc) => {
      const populatedDoc = { ...doc };

      for (const relation of relationFields) {
        const relatedValue = populatedDoc[relation.field];
        if (relatedValue !== undefined && relatedValue !== null) {
          try {
            let relatedDoc;

            if (relation.isObjectId) {
              // For ObjectId references, use findById
              relatedDoc = await findById(
                relation.relatedCollection,
                relatedValue.toString()
              );
            } else {
              // For numeric references, use findAll with filter
              // Use the same field name in the related collection
              const result = await findAll(relation.relatedCollection, {
                [relation.field]: relatedValue,
                limit: 1,
                page: 1,
              });
              relatedDoc =
                result.data && result.data.length > 0 ? result.data[0] : null;
            }

            if (relatedDoc) {
              // Use singular form for the populated field name (remove 's')
              const populatedFieldName = relation.relatedCollection.endsWith(
                "s"
              )
                ? relation.relatedCollection.slice(0, -1)
                : relation.relatedCollection;
              populatedDoc[populatedFieldName] = relatedDoc;
            }
          } catch (error) {
            // If relation lookup fails, continue without populating
            console.warn(
              `Failed to populate ${relation.field} for ${collection_name}:`,
              error.message
            );
          }
        }
      }

      return populatedDoc;
    })
  );

  return populatedDocuments;
}

function applyDefaults(collection_name, data) {
  const model = getModel(collection_name);
  const schema = model.schema;
  const result = { ...data };

  // Apply default values from schema
  Object.keys(schema).forEach((field) => {
    // Skip if value is already provided
    if (result[field] !== undefined) return;

    // Apply default if it exists
    if (schema[field].default !== undefined) {
      result[field] = schema[field].default;
    }
  });

  return result;
}

export async function findAll(collection_name, query_params = {}) {
  try {
    const db = getDatabase();
    const collection = db.collection(collection_name);

    const {
      search,
      limit = 10,
      is_count = false,
      page = 1,
      include_relations = false,
      ...filters
    } = query_params;

    // Get model schema for type checking
    const model = getModel(collection_name);
    const schema = model.schema;

    // Build query - start with non-deleted documents
    let query = { deleted_at: { $exists: false } };

    // Add search query
    const searchQuery = buildSearchQuery(collection_name, search);
    if (Object.keys(searchQuery).length > 0) {
      query = { ...query, ...searchQuery };
    }

    // Add additional filters with type conversion
    Object.keys(filters).forEach((key) => {
      let value = filters[key];
      
      // Skip undefined, null, or empty string values
      if (value === undefined || value === null || value === "") {
        return;
      }

      // If value is an array with single element, extract it
      // This handles query params that come as arrays from some frameworks
      if (Array.isArray(value) && value.length === 1) {
        value = value[0];
      }

      // Check if field exists in schema
      if (schema[key]) {
        const fieldType = schema[key].type;
        
        // Convert to appropriate type based on schema
        if (fieldType === "number") {
          const numValue = Number(value);
          // Skip if conversion results in NaN
          if (!isNaN(numValue)) {
            query[key] = numValue;
          }
        } else if (fieldType === "objectId") {
          try {
            query[key] = new ObjectId(value);
          } catch (e) {
            // Skip invalid ObjectId
            console.warn(`Invalid ObjectId for field ${key}:`, value);
          }
        } else if (fieldType === "boolean") {
          // Convert string to boolean
          query[key] = value === "true" || value === true;
        } else if (fieldType === "date") {
          // Convert to Date object
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime())) {
            query[key] = dateValue;
          }
        } else {
          // For string and other types, use as-is
          query[key] = value;
        }
      } else {
        // Field not in schema, but still allow querying
        // This handles dynamic fields or fields not defined in schema
        query[key] = value;
      }
    });

    // Debug: Log the final query (remove this after debugging)
    console.log('Final MongoDB query:', JSON.stringify(query));

    // If only count is requested
    if (is_count) {
      const total = await collection.countDocuments(query);
      return { count: total };
    }

    // Handle pagination
    let paginated_data = collection.find(query);

    if (limit !== "no_limit") {
      const limitNum = Math.min(parseInt(limit) || 10, 100); // Max 100 items
      const skip = (page - 1) * limitNum;

      paginated_data = paginated_data.skip(skip).limit(limitNum);

      // Get total count for pagination
      const total = await collection.countDocuments(query);
      const totalPages = Math.ceil(total / limitNum);

      const results = await paginated_data.toArray();

      // Populate relations if requested
      let populatedResults = results;
      if (include_relations) {
        populatedResults = await populateRelations(collection_name, results);
      }

      return {
        data: populatedResults,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: total,
          per_page: limitNum,
        },
      };
    }

    // No limit case
    const results = await paginated_data.toArray();

    // Populate relations if requested
    let populatedResults = results;
    if (include_relations) {
      populatedResults = await populateRelations(collection_name, results);
    }

    return { data: populatedResults };
  } catch (error) {
    throw new Error(`Failed to fetch ${collection_name}: ${error.message}`);
  }
}

export async function findById(collection_name, id) {
  try {
    const db = getDatabase();
    const collection = db.collection(collection_name);

    let query;
    try {
      query = { _id: new ObjectId(id), deleted_at: { $exists: false } };
    } catch (e) {
      throw new Error("Invalid ID format");
    }

    const result = await collection.findOne(query);
    if (!result) {
      throw new Error(`${collection_name.slice(0, -1)} not found`);
    }

    return result;
  } catch (error) {
    throw new Error(
      `Failed to fetch ${collection_name.slice(0, -1)}: ${error.message}`
    );
  }
}

// Update the create function - add this line after line 20 (after validation):
export async function create(collection_name, data) {
  try {
    const db = getDatabase();
    const collection = db.collection(collection_name);

    // Special validation for candidates - check if user is already a candidate
    if (collection_name === "candidates" && data.user_id) {
      const existingCandidate = await collection.findOne({
        user_id: new ObjectId(data.user_id),
        period_start: data.period_start,
        period_end: data.period_end,
        deleted_at: { $exists: false },
      });

      if (existingCandidate) {
        throw new Error(
          "User is already registered as a candidate for this period. Each user can only be a candidate for one position per period."
        );
      }
    }

    // Validate data using model validation
    const model = getModel(collection_name);
    if (
      model.validateUser ||
      model.validatePosition ||
      model.validateCandidate ||
      model.validateVote ||
      model.validateElection
    ) {
      const validateFunction =
        model[
          `validate${
            collection_name.charAt(0).toUpperCase() +
            collection_name.slice(1, -1)
          }`
        ];
      if (validateFunction) {
        const errors = validateFunction(data);
        if (errors.length > 0) {
          throw new Error(`Validation failed: ${errors.join(", ")}`);
        }
      }
    }

    // Apply schema defaults
    const dataWithDefaults = applyDefaults(collection_name, data);

    // Convert string IDs to ObjectIds and add timestamps
    const processedData = convertObjectIds(addTimestamps(dataWithDefaults));

    // Hash password if this is a user collection and password exists
    if (collection_name === "users" && processedData.password) {
      processedData.password = await bcrypt.hash(processedData.password, 10);
    }

    const result = await collection.insertOne(processedData);

    // Return the created document
    return await collection.findOne({ _id: result.insertedId });
  } catch (error) {
    if (error.code === 11000) {
      throw new Error(
        "Duplicate entry: A record with this unique field already exists"
      );
    }
    throw new Error(
      `Failed to create ${collection_name.slice(0, -1)}: ${error.message}`
    );
  }
}

export async function update(collection_name, id, data) {
  try {
    const db = getDatabase();
    const collection = db.collection(collection_name);

    let query;
    try {
      query = { _id: new ObjectId(id), deleted_at: { $exists: false } };
    } catch (e) {
      throw new Error("Invalid ID format");
    }

    // Check if document exists
    const existing = await collection.findOne(query);
    if (!existing) {
      throw new Error(`${collection_name.slice(0, -1)} not found`);
    }

    // Remove fields that shouldn't be updated
    const { _id, created_at, deleted_at, ...updateData } = data;

    // Convert string IDs to ObjectIds and add updated timestamp
    const processedData = convertObjectIds(addTimestamps(updateData, true));

    // Hash password if this is a user collection and password exists
    if (collection_name === "users" && processedData.password) {
      processedData.password = await bcrypt.hash(processedData.password, 10);
    }

    const result = await collection.updateOne(query, { $set: processedData });

    if (result.matchedCount === 0) {
      throw new Error(`${collection_name.slice(0, -1)} not found`);
    }

    // Return the updated document
    return await collection.findOne({ _id: new ObjectId(id) });
  } catch (error) {
    if (error.code === 11000) {
      throw new Error(
        "Duplicate entry: A record with this unique field already exists"
      );
    }
    throw new Error(
      `Failed to update ${collection_name.slice(0, -1)}: ${error.message}`
    );
  }
}
export async function softDelete(collection_name, id) {
  try {
    const db = getDatabase();
    const collection = db.collection(collection_name);

    let query;
    try {
      query = {
        _id: new ObjectId(id),
        deleted_at: { $exists: false },
        role: { $ne: "admin" },
      };
    } catch (e) {
      throw new Error("Invalid ID format");
    }

    const result = await collection.updateOne(query, {
      $set: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });

    if (result.matchedCount === 0) {
      throw new Error(`${collection_name.slice(0, -1)} not found`);
    }

    return { message: `${collection_name.slice(0, -1)} deleted successfully` };
  } catch (error) {
    throw new Error(
      `Failed to delete ${collection_name.slice(0, -1)}: ${error.message}`
    );
  }
}

export async function hardDelete(collection_name, id) {
  try {
    const db = getDatabase();
    const collection = db.collection(collection_name);

    let query;
    try {
      query = {
        _id: new ObjectId(id),
        deleted_at: { $exists: false },
        role: { $ne: "admin" },
      };
    } catch (e) {
      throw new Error("Invalid ID format");
    }

    const result = await collection.deleteOne(query);

    if (result.matchedCount === 0) {
      throw new Error(`${collection_name.slice(0, -1)} not found`);
    }

    return { message: `${collection_name.slice(0, -1)} deleted successfully` };
  } catch (error) {
    throw new Error(
      `Failed to delete ${collection_name.slice(0, -1)}: ${error.message}`
    );
  }
}

// Special function to check for duplicate votes
export async function checkVoteConstraint(
  user_id,
  position_id,
  period_start,
  period_end
) {
  try {
    const db = getDatabase();
    const collection = db.collection("votes");

    const existing = await collection.findOne({
      user_id: new ObjectId(user_id),
      position_id,
      period_start,
      period_end,
      deleted_at: { $exists: false },
    });

    return existing !== null;
  } catch (error) {
    throw new Error(`Failed to check vote constraint: ${error.message}`);
  }
}
export async function flushDelete(collections) {
  try {
    const db = getDatabase();
    const results = [];

    for (const collectionName of collections) {
      const collection = db.collection(collectionName);

      // Hard delete: Remove all documents
      let query = {};
      if (collectionName === "users") {
        query = { role: { $ne: "admin" } };
      }

      const result = await collection.deleteMany(query);

      results.push({
        collection: collectionName,
        deletedCount: result.deletedCount,
        message: `${collectionName} flushed successfully`,
      });
    }

    return {
      message: "All specified collections flushed successfully",
      details: results,
    };
  } catch (error) {
    throw new Error(`Failed to flush collections: ${error.message}`);
  }
}

// Update bulkCreate - apply defaults in the processing loop
export async function bulkCreate(collection_name, data) {
  const session = getDatabase().client.startSession();
  let result;

  try {
    result = await session.withTransaction(async () => {
      const db = getDatabase();
      const collection = db.collection(collection_name);

      // Special validation for candidates - check if users are already candidates
      if (collection_name === "candidates") {
        const userIds = data.map((item) => new ObjectId(item.user_id));

        // Group by period to check each period separately
        const periodGroups = {};
        data.forEach((item) => {
          const key = `${item.period_start}-${item.period_end}`;
          if (!periodGroups[key]) {
            periodGroups[key] = [];
          }
          periodGroups[key].push(item.user_id);
        });

        // Check for existing candidates in each period
        for (const [periodKey, userIdsInPeriod] of Object.entries(
          periodGroups
        )) {
          const [period_start, period_end] = periodKey.split("-").map(Number);

          const existingCandidates = await collection
            .find(
              {
                user_id: { $in: userIdsInPeriod.map((id) => new ObjectId(id)) },
                period_start,
                period_end,
                deleted_at: { $exists: false },
              },
              { session }
            )
            .toArray();

          if (existingCandidates.length > 0) {
            const existingUserIds = existingCandidates.map((c) =>
              c.user_id.toString()
            );
            throw new Error(
              `Some users are already registered as candidates for period ${period_start}-${period_end}. User IDs: ${existingUserIds.join(
                ", "
              )}. Each user can only be a candidate for one position per period.`
            );
          }
        }
      }

      // Process each item with defaults, timestamps and ObjectId conversion
      const processedData = data.map((item) => {
        const withDefaults = applyDefaults(collection_name, item);
        const processed = convertObjectIds(addTimestamps(withDefaults));
        return processed;
      });

      // Hash passwords for users if needed
      if (collection_name === "users") {
        for (let item of processedData) {
          if (item.password) {
            item.password = await bcrypt.hash(item.password, 10);
          }
        }
      }

      const insertResult = await collection.insertMany(processedData, {
        ordered: false,
        session,
      });

      return {
        message: "Bulk create successful",
        insertedCount: insertResult.insertedCount,
        insertedIds: insertResult.insertedIds,
      };
    });

    return result;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error(
        "Duplicate entry: A record with this unique field already exists"
      );
    }
    throw new Error(
      `Failed to bulk create ${collection_name.slice(0, -1)}: ${error.message}`
    );
  } finally {
    await session.endSession();
  }
}

/**
 * Example payload for bulkCreate users
 * @example
[
  {
    "nis": "124125",
    "nama_lengkap": "John Doe",
    "password": "password123",
    "role": "voter",
    "class": "X MPLB 1",
    "gender": "L"
  },
  {
    "nis": "123452",
    "nama_lengkap": "Jane Doe",
    "password": "password123",
    "role": "voter",
    "class": "X PPLG 1",
    "gender": "P"
  }
]
 */
