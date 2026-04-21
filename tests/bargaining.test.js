/**
 * Bargaining Logic Unit Tests
 *
 * Tests the core business rules in listingService.startBargaining
 * and transactionService state transitions using mocked models.
 */

// Mock mongoose and all models so tests run without a live DB
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    startSession: jest.fn().mockResolvedValue(null) // Disable sessions in tests
  };
});

jest.mock('../src/models/listingModel');
jest.mock('../src/models/transactionModel');
jest.mock('../src/models/notificationModel');

const Listing     = require('../src/models/listingModel');
const Transaction = require('../src/models/transactionModel');
const ListingService = require('../src/services/listingService');

const OWNER_ID  = '000000000000000000000001';
const ACTOR_ID  = '000000000000000000000002';
const LISTING_ID = '000000000000000000000010';
const TX_ID     = '000000000000000000000020';

function makeListing(overrides = {}) {
  return {
    _id: LISTING_ID,
    title: 'Test Item',
    type: 'have',
    status: 'active',
    user: { _id: OWNER_ID },
    activeBargainer: null,
    save: jest.fn().mockResolvedValue(true),
    ...overrides
  };
}

function makeTx(overrides = {}) {
  return {
    _id: TX_ID,
    listing: LISTING_ID,
    buyer: ACTOR_ID,
    seller: OWNER_ID,
    status: 'pending',
    comments: [],
    save: jest.fn().mockResolvedValue(true),
    ...overrides
  };
}

describe('ListingService.startBargaining', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks the listing owner from interacting with their own post', async () => {
    Listing.findById = jest.fn().mockReturnValue({
      session: jest.fn().mockResolvedValue(makeListing())
    });

    await expect(
      ListingService.startBargaining(LISTING_ID, OWNER_ID, 'buy', '')
    ).rejects.toThrow('You cannot interact with your own post');
  });

  it('blocks interaction on a non-active listing', async () => {
    Listing.findById = jest.fn().mockReturnValue({
      session: jest.fn().mockResolvedValue(makeListing({ status: 'bargaining' }))
    });

    await expect(
      ListingService.startBargaining(LISTING_ID, ACTOR_ID, 'buy', '')
    ).rejects.toThrow('not available for new bargaining');
  });

  it('blocks invalid action for a "have" post', async () => {
    Listing.findById = jest.fn().mockReturnValue({
      session: jest.fn().mockResolvedValue(makeListing({ type: 'have' }))
    });

    await expect(
      ListingService.startBargaining(LISTING_ID, ACTOR_ID, 'provide', '')
    ).rejects.toThrow('Invalid action for this post');
  });

  it('blocks invalid action for a "need" post', async () => {
    Listing.findById = jest.fn().mockReturnValue({
      session: jest.fn().mockResolvedValue(makeListing({ type: 'need' }))
    });

    await expect(
      ListingService.startBargaining(LISTING_ID, ACTOR_ID, 'buy', '')
    ).rejects.toThrow('Invalid action for this post');
  });

  it('creates a transaction and updates listing status on valid bargain', async () => {
    const listing = makeListing();
    Listing.findById = jest.fn().mockReturnValue({
      session: jest.fn().mockResolvedValue(listing)
    });

    const tx = makeTx();
    Transaction.create = jest.fn().mockResolvedValue([tx]);

    const result = await ListingService.startBargaining(LISTING_ID, ACTOR_ID, 'buy', 'Is this still available?');

    expect(Transaction.create).toHaveBeenCalledTimes(1);
    const payload = Transaction.create.mock.calls[0][0][0];
    expect(payload.buyer).toBe(ACTOR_ID);
    expect(payload.seller).toEqual({ _id: OWNER_ID });
    expect(payload.initiatorRole).toBe('buyer');
    expect(payload.comments[0].text).toBe('Is this still available?');

    expect(listing.status).toBe('bargaining');
    expect(listing.activeBargainer).toBe(ACTOR_ID);
    expect(listing.save).toHaveBeenCalledTimes(1);
    expect(result).toBe(tx);
  });
});
