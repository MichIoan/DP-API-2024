/**
 * Unit tests for the Base Controller
 */
const BaseController = require('../../src/controllers/BaseController');
const responseUtils = require('../../src/utils/responseUtils');

// Mock responseUtils
jest.mock('../../src/utils/responseUtils', () => ({
  successResponse: jest.fn().mockReturnValue({
    statusCode: 200,
    body: { success: true }
  }),
  errorResponse: jest.fn().mockReturnValue({
    statusCode: 400,
    body: { success: false }
  }),
  notFoundResponse: jest.fn().mockReturnValue({
    statusCode: 404,
    body: { success: false }
  }),
  unauthorizedResponse: jest.fn().mockReturnValue({
    statusCode: 401,
    body: { success: false }
  }),
  forbiddenResponse: jest.fn().mockReturnValue({
    statusCode: 403,
    body: { success: false }
  }),
  validationErrorResponse: jest.fn().mockReturnValue({
    statusCode: 422,
    body: { success: false }
  }),
  serverErrorResponse: jest.fn().mockReturnValue({
    statusCode: 500,
    body: { success: false }
  })
}));

describe('BaseController', () => {
  let baseController;
  let req;
  let res;
  
  beforeEach(() => {
    baseController = new BaseController();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('handleSuccess', () => {
    it('should call responseUtils.successResponse and return response', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Success message';
      const meta = { page: 1 };
      
      baseController.handleSuccess(req, res, 201, data, message, meta);
      
      expect(responseUtils.successResponse).toHaveBeenCalledWith(201, message, data, meta);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });
  
  describe('handleError', () => {
    it('should call responseUtils.errorResponse and return response', () => {
      const message = 'Error message';
      const errors = ['Error 1', 'Error 2'];
      
      baseController.handleError(req, res, 400, message, errors);
      
      expect(responseUtils.errorResponse).toHaveBeenCalledWith(400, message, errors);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false });
    });
  });
  
  describe('handleNotFound', () => {
    it('should call responseUtils.notFoundResponse and return response', () => {
      const resource = 'User';
      
      baseController.handleNotFound(req, res, resource);
      
      expect(responseUtils.notFoundResponse).toHaveBeenCalledWith(resource);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false });
    });
  });
  
  describe('handleUnauthorized', () => {
    it('should call responseUtils.unauthorizedResponse and return response', () => {
      const message = 'Unauthorized message';
      
      baseController.handleUnauthorized(req, res, message);
      
      expect(responseUtils.unauthorizedResponse).toHaveBeenCalledWith(message);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false });
    });
  });
  
  describe('handleForbidden', () => {
    it('should call responseUtils.forbiddenResponse and return response', () => {
      const message = 'Forbidden message';
      
      baseController.handleForbidden(req, res, message);
      
      expect(responseUtils.forbiddenResponse).toHaveBeenCalledWith(message);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ success: false });
    });
  });
  
  describe('handleValidationError', () => {
    it('should call responseUtils.validationErrorResponse and return response', () => {
      const errors = ['Validation error 1', 'Validation error 2'];
      
      baseController.handleValidationError(req, res, errors);
      
      expect(responseUtils.validationErrorResponse).toHaveBeenCalledWith(errors);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({ success: false });
    });
  });
  
  describe('handleServerError', () => {
    it('should call responseUtils.serverErrorResponse and return response', () => {
      const message = 'Server error message';
      const error = new Error('Test error');
      
      baseController.handleServerError(req, res, message, error);
      
      expect(responseUtils.serverErrorResponse).toHaveBeenCalledWith(message, error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false });
    });
  });
  
  describe('validateRequiredFields', () => {
    it('should return isValid true when all required fields are present', () => {
      const body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const result = baseController.validateRequiredFields(body, ['email', 'password']);
      
      expect(result).toEqual({
        isValid: true,
        missingFields: []
      });
    });
    
    it('should return isValid false and missing fields when required fields are missing', () => {
      const body = {
        email: 'test@example.com'
      };
      
      const result = baseController.validateRequiredFields(body, ['email', 'password']);
      
      expect(result).toEqual({
        isValid: false,
        missingFields: ['password']
      });
    });
  });
  
  describe('convertParams', () => {
    it('should convert parameters to expected types', () => {
      const params = {
        id: '123',
        active: 'true',
        date: '2023-01-01',
        name: 'Test'
      };
      
      const typeMap = {
        id: 'number',
        active: 'boolean',
        date: 'date',
        name: 'string'
      };
      
      const result = baseController.convertParams(params, typeMap);
      
      expect(result).toEqual({
        id: 123,
        active: true,
        date: expect.any(Date),
        name: 'Test'
      });
    });
    
    it('should ignore undefined parameters', () => {
      const params = {
        id: '123'
      };
      
      const typeMap = {
        id: 'number',
        active: 'boolean'
      };
      
      const result = baseController.convertParams(params, typeMap);
      
      expect(result).toEqual({
        id: 123
      });
    });
  });
});
