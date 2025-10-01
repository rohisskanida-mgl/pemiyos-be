import { Hono } from 'hono';
import * as crudController from '../controllers/crud.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const crud = new Hono();

// Protect all CRUD routes with authentication
crud.use('*', authMiddleware);

// Dynamic CRUD routes
crud.get('/:collection_name', crudController.getAll);
crud.get('/:collection_name/:id', crudController.getById);
crud.post('/:collection_name', crudController.create);
crud.put('/:collection_name/:id', crudController.update);
crud.delete('/:collection_name/:id', crudController.softDelete);

export default crud;