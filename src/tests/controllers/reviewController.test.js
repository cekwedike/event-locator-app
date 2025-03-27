const { expect } = require('chai');
const sinon = require('sinon');
const { db } = require('../../config/database');
const {
  getEventReviews,
  createReview,
  updateReview,
  deleteReview
} = require('../../controllers/reviewController');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');

describe('Review Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id: 1 },
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

  describe('getEventReviews', () => {
    it('should return reviews for an event with average rating', async () => {
      const mockReviews = [
        { id: 1, rating: 5, comment: 'Great event!', username: 'user1' },
        { id: 2, rating: 4, comment: 'Good event', username: 'user2' }
      ];

      req.params.eventId = 1;
      sinon.stub(db, 'any').resolves(mockReviews);

      await getEventReviews(req, res, next);

      expect(db.any.calledOnce).to.be.true;
      expect(res.json.calledWith({
        reviews: mockReviews,
        averageRating: 4.5
      })).to.be.true;
    });

    it('should return empty reviews array and 0 rating when no reviews exist', async () => {
      req.params.eventId = 1;
      sinon.stub(db, 'any').resolves([]);

      await getEventReviews(req, res, next);

      expect(res.json.calledWith({
        reviews: [],
        averageRating: 0
      })).to.be.true;
    });
  });

  describe('createReview', () => {
    it('should create a new review', async () => {
      const mockReview = {
        id: 1,
        user_id: 1,
        event_id: 1,
        rating: 5,
        comment: 'Great event!'
      };

      const mockUser = {
        id: 1,
        username: 'user1',
        avatar_url: 'avatar.jpg'
      };

      req.params.eventId = 1;
      req.body = {
        rating: 5,
        comment: 'Great event!'
      };

      sinon.stub(db, 'oneOrNone').resolves(null); // No existing review
      sinon.stub(db, 'one').resolves(mockReview);
      sinon.stub(db, 'one').resolves(mockUser);

      await createReview(req, res, next);

      expect(db.one.calledTwice).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith({
        message: 'reviews.create.success',
        review: {
          ...mockReview,
          user: {
            id: mockUser.id,
            username: mockUser.username,
            avatar_url: mockUser.avatar_url
          }
        }
      })).to.be.true;
    });

    it('should throw ForbiddenError when user has already reviewed', async () => {
      req.params.eventId = 1;
      req.body = {
        rating: 5,
        comment: 'Great event!'
      };

      sinon.stub(db, 'oneOrNone').resolves({ id: 1 }); // Existing review

      await createReview(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(ForbiddenError))).to.be.true;
    });
  });

  describe('updateReview', () => {
    it('should update an existing review', async () => {
      const mockReview = {
        id: 1,
        user_id: 1,
        event_id: 1,
        rating: 4,
        comment: 'Updated comment'
      };

      req.params.id = 1;
      req.body = {
        rating: 4,
        comment: 'Updated comment'
      };

      sinon.stub(db, 'oneOrNone').resolves({ id: 1, user_id: 1 }); // Existing review
      sinon.stub(db, 'one').resolves(mockReview);

      await updateReview(req, res, next);

      expect(db.one.calledOnce).to.be.true;
      expect(res.json.calledWith({
        message: 'reviews.update.success',
        review: mockReview
      })).to.be.true;
    });

    it('should throw NotFoundError when review not found', async () => {
      req.params.id = 999;
      req.body = {
        rating: 4,
        comment: 'Updated comment'
      };

      sinon.stub(db, 'oneOrNone').resolves(null);

      await updateReview(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(NotFoundError))).to.be.true;
    });

    it('should throw ForbiddenError when user is not the review owner', async () => {
      req.params.id = 1;
      req.body = {
        rating: 4,
        comment: 'Updated comment'
      };

      sinon.stub(db, 'oneOrNone').resolves({ id: 1, user_id: 2 }); // Different user

      await updateReview(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(ForbiddenError))).to.be.true;
    });
  });

  describe('deleteReview', () => {
    it('should delete an existing review', async () => {
      req.params.id = 1;

      sinon.stub(db, 'oneOrNone').resolves({ id: 1, user_id: 1 }); // Existing review
      sinon.stub(db, 'result').resolves({ rowCount: 1 });

      await deleteReview(req, res, next);

      expect(db.result.calledOnce).to.be.true;
      expect(res.json.calledWith({
        message: 'reviews.delete.success'
      })).to.be.true;
    });

    it('should throw NotFoundError when review not found', async () => {
      req.params.id = 999;

      sinon.stub(db, 'oneOrNone').resolves(null);

      await deleteReview(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(NotFoundError))).to.be.true;
    });

    it('should throw ForbiddenError when user is not the review owner', async () => {
      req.params.id = 1;

      sinon.stub(db, 'oneOrNone').resolves({ id: 1, user_id: 2 }); // Different user

      await deleteReview(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(ForbiddenError))).to.be.true;
    });
  });
}); 