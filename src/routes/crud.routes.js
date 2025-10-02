import { Hono } from 'hono';
import * as CrudController from '../controllers/crud.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const crud = new Hono();

// Protect all CRUD routes with authentication
crud.use('*', authMiddleware);

// Dynamic CRUD routes
crud.delete('/flush', adminMiddleware, CrudController.flushDelete);
crud.get('/:collection_name', CrudController.getAll);
crud.post('/:collection_name/bulk', CrudController.bulkCreate);
crud.get('/:collection_name/:id', CrudController.getById);
crud.post('/:collection_name', CrudController.create);
crud.put('/:collection_name/:id', CrudController.update);
crud.delete('/:collection_name/:id', adminMiddleware, CrudController.softDelete);
crud.delete('/:collection_name/:id/hard', adminMiddleware, CrudController.hardDelete);
export default crud;