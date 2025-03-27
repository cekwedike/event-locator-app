const { expect } = require('chai');
const sinon = require('sinon');
const { db } = require('../../config/database');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../../controllers/categoryController');
const { NotFoundError } = require('../../utils/errors');

describe('Category Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      t: (key) => key
    };
    res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis()
    };
    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getCategories', () => {
    it('should return all categories with event counts', async () => {
      const mockCategories = [
        { id: 1, name: 'Music', event_count: 5 },
        { id: 2, name: 'Sports', event_count: 3 }
      ];

      sinon.stub(db, 'any').resolves(mockCategories);

      await getCategories(req, res, next);

      expect(db.any.calledOnce).to.be.true;
      expect(res.json.calledWith({ categories: mockCategories })).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      sinon.stub(db, 'any').rejects(error);

      await getCategories(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getCategory', () => {
    it('should return a category by ID', async () => {
      const mockCategory = {
        id: 1,
        name: 'Music',
        event_count: 5,
        event_ids: [1, 2, 3],
        event_titles: ['Concert 1', 'Concert 2', 'Concert 3']
      };

      req.params.id = 1;
      sinon.stub(db, 'oneOrNone').resolves(mockCategory);

      await getCategory(req, res, next);

      expect(db.oneOrNone.calledOnce).to.be.true;
      expect(res.json.calledWith({ category: mockCategory })).to.be.true;
    });

    it('should throw NotFoundError when category not found', async () => {
      req.params.id = 999;
      sinon.stub(db, 'oneOrNone').resolves(null);

      await getCategory(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(NotFoundError))).to.be.true;
    });
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const mockCategory = {
        id: 1,
        name: 'New Category',
        description: 'Description'
      };

      req.body = {
        name: 'New Category',
        description: 'Description'
      };

      sinon.stub(db, 'one').resolves(mockCategory);

      await createCategory(req, res, next);

      expect(db.one.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith({
        message: 'categories.create.success',
        category: mockCategory
      })).to.be.true;
    });

    it('should handle validation errors', async () => {
      req.body = { name: '' };
      const validationError = {
        isEmpty: () => false,
        array: () => [{ msg: 'Category name is required' }]
      };

      sinon.stub(require('express-validator'), 'validationResult')
        .returns(validationError);

      await createCategory(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({
        errors: [{ msg: 'Category name is required' }]
      })).to.be.true;
    });
  });

  describe('updateCategory', () => {
    it('should update an existing category', async () => {
      const mockCategory = {
        id: 1,
        name: 'Updated Category',
        description: 'Updated Description'
      };

      req.params.id = 1;
      req.body = {
        name: 'Updated Category',
        description: 'Updated Description'
      };

      sinon.stub(db, 'oneOrNone').resolves(mockCategory);

      await updateCategory(req, res, next);

      expect(db.oneOrNone.calledOnce).to.be.true;
      expect(res.json.calledWith({
        message: 'categories.update.success',
        category: mockCategory
      })).to.be.true;
    });

    it('should throw NotFoundError when category not found', async () => {
      req.params.id = 999;
      req.body = {
        name: 'Updated Category',
        description: 'Updated Description'
      };

      sinon.stub(db, 'oneOrNone').resolves(null);

      await updateCategory(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(NotFoundError))).to.be.true;
    });
  });

  describe('deleteCategory', () => {
    it('should delete an existing category', async () => {
      req.params.id = 1;
      sinon.stub(db, 'result').resolves({ rowCount: 1 });

      await deleteCategory(req, res, next);

      expect(db.result.calledOnce).to.be.true;
      expect(res.json.calledWith({
        message: 'categories.delete.success'
      })).to.be.true;
    });

    it('should throw NotFoundError when category not found', async () => {
      req.params.id = 999;
      sinon.stub(db, 'result').resolves({ rowCount: 0 });

      await deleteCategory(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(NotFoundError))).to.be.true;
    });
  });
}); 