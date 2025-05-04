/**
 * Comprehensive Sequelize mock for tests
 */
const SequelizeMock = require('sequelize-mock');

// Create DataTypes mock that matches Sequelize's DataTypes
const DataTypes = {
  STRING: 'STRING',
  TEXT: 'TEXT',
  INTEGER: 'INTEGER',
  FLOAT: 'FLOAT',
  REAL: 'REAL',
  DOUBLE: 'DOUBLE',
  DECIMAL: 'DECIMAL',
  DATE: 'DATE',
  DATEONLY: 'DATEONLY',
  BOOLEAN: 'BOOLEAN',
  ENUM: (...values) => ({ type: 'ENUM', values }),
  ARRAY: (type) => ({ type: 'ARRAY', subtype: type }),
  JSON: 'JSON',
  JSONB: 'JSONB',
  UUID: 'UUID',
  UUIDV4: 'UUIDV4',
  VIRTUAL: 'VIRTUAL',
  // Add any other DataTypes used in your models
};

// Create a mock Sequelize class
class MockSequelize {
  constructor() {
    this.models = {};
    this.DataTypes = DataTypes;
    this.QueryTypes = {
      SELECT: 'SELECT',
      INSERT: 'INSERT',
      UPDATE: 'UPDATE',
      DELETE: 'DELETE',
      // Add other query types as needed
    };
  }

  authenticate() {
    return Promise.resolve();
  }

  sync() {
    return Promise.resolve(this);
  }

  define(modelName, attributes, options = {}) {
    // Create a model with basic CRUD methods
    const model = {
      name: modelName,
      attributes,
      options,
      findOne: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue([]),
      findByPk: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue([1]),
      destroy: jest.fn().mockResolvedValue(1),
      count: jest.fn().mockResolvedValue(0),
      // Association methods
      belongsTo: jest.fn().mockReturnThis(),
      hasMany: jest.fn().mockReturnThis(),
      hasOne: jest.fn().mockReturnThis(),
      belongsToMany: jest.fn().mockReturnThis(),
      // Add the sequelize reference
      sequelize: this,
      // Add any other methods needed
    };

    this.models[modelName] = model;
    return model;
  }

  model(modelName) {
    return this.models[modelName];
  }

  transaction(callback) {
    const transaction = { 
      commit: jest.fn().mockResolvedValue(), 
      rollback: jest.fn().mockResolvedValue() 
    };
    
    if (callback) {
      return Promise.resolve(callback(transaction));
    }
    return Promise.resolve(transaction);
  }

  query(sql, options) {
    return Promise.resolve([[], {}]);
  }
}

// Create a singleton instance
const sequelize = new MockSequelize();

module.exports = {
  Sequelize: MockSequelize,
  sequelize,
  DataTypes
};
