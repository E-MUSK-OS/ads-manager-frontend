import { describe, it } from 'node:test';
import assert from 'node:assert';
import { toPayload, defaultDraft } from '../helpers';
import type { CampaignDraft, MarketplaceRules } from '@/lib/types/campaign';

const MOCK_RULES: MarketplaceRules = {
  currency: 'INR',
  symbol: '₹',
  locale: 'en-IN',
  tz: 'Asia/Kolkata',
  min_budget: 50.0,
  recommended_budget: 500.0,
  min_bid: 2.0,
  max_bid: 500.0,
};

describe('toPayload mapping unit tests', () => {
  it('maps Auto campaign with single default bid correctly', () => {
    const draft: CampaignDraft = {
      version: 1,
      accountId: 42,
      step: 5,
      maxStepReached: 5,
      details: {
        name: 'Auto Shoes Campaign',
        startDate: '2026-10-20',
        endDate: null,
        dailyBudget: 150,
        monthlyPlan: false,
        monthlyBudget: null,
        targetAcos: 25,
        adGroupName: 'Shoes Default Ad Group',
        site: 'AMAZON_AND_BEYOND',
        targetingType: 'AUTO',
        strategy: 'AUTO_FOR_SALES',
        placements: {
          top: 30,
          rest: 10,
          productPage: 0,
        },
      },
      products: {
        selected: [
          { id: 101, asin: 'B0791TX5P5', title: 'Running Shoes', image_url: null, price: 1999 },
        ],
      },
      targeting: {
        bidMode: 'DEFAULT',
        defaultBid: 3.5,
        autoGroups: [
          { key: 'CLOSE_MATCH', enabled: true, bid: 3.5 },
          { key: 'LOOSE_MATCH', enabled: true, bid: 3.5 },
          { key: 'SUBSTITUTES', enabled: true, bid: 3.5 },
          { key: 'COMPLEMENTS', enabled: true, bid: 3.5 },
        ],
        manualTab: 'KEYWORDS',
        keywords: [],
        targets: [],
      },
      negatives: {
        keywords: [],
        brands: [],
        asins: [],
      },
    };

    const payload = toPayload(draft, MOCK_RULES);

    assert.strictEqual(payload.ads_account_id, 42);
    assert.strictEqual(payload.name, 'Auto Shoes Campaign');
    assert.strictEqual(payload.campaign_type, 'SPONSORED_PRODUCTS');
    assert.strictEqual(payload.targeting_type, 'AUTO');
    assert.strictEqual(payload.site, 'AMAZON_AND_BEYOND');
    assert.strictEqual(payload.state, 'ENABLED');
    assert.strictEqual(payload.daily_budget, 150);
    assert.strictEqual(payload.target_acos, 25);
    assert.strictEqual(payload.bidding_strategy, 'AUTO_FOR_SALES');
    assert.strictEqual(payload.placement_top_pct, 30);
    assert.strictEqual(payload.placement_rest_pct, 10);
    assert.strictEqual(payload.placement_product_page_pct, 0);
    assert.deepStrictEqual(payload.product_ids, [101]);

    assert.strictEqual(payload.ad_groups.length, 1);
    const ag = payload.ad_groups[0];
    assert.strictEqual(ag.name, 'Shoes Default Ad Group');
    assert.strictEqual(ag.default_bid, 3.5);
    assert.strictEqual(ag.keywords.length, 0);
    assert.strictEqual(ag.targets.length, 4);
    assert.strictEqual(ag.targets[0].kind, 'AUTO_GROUP');
    assert.strictEqual(ag.targets[0].value, 'CLOSE_MATCH');
    assert.strictEqual(ag.targets[0].bid, undefined); // undefined when bidMode is DEFAULT
  });

  it('maps Auto campaign by group with individual bids correctly', () => {
    const draft: CampaignDraft = {
      version: 1,
      accountId: 10,
      step: 5,
      maxStepReached: 5,
      details: {
        name: 'Auto By Group Campaign',
        startDate: '2026-10-25',
        endDate: '2026-11-25',
        dailyBudget: 200,
        monthlyPlan: false,
        monthlyBudget: null,
        targetAcos: null,
        adGroupName: 'Grouped Ad Group',
        site: 'AMAZON_BUSINESS',
        targetingType: 'AUTO',
        strategy: 'LEGACY_FOR_SALES',
        placements: { top: null, rest: null, productPage: null },
      },
      products: {
        selected: [
          { id: 201, asin: 'B084DWG2VQ', title: 'Smart Watch', image_url: null, price: 4999 },
        ],
      },
      targeting: {
        bidMode: 'BY_GROUP',
        defaultBid: 2.0,
        autoGroups: [
          { key: 'CLOSE_MATCH', enabled: true, bid: 4.5 },
          { key: 'LOOSE_MATCH', enabled: true, bid: 2.5 },
          { key: 'SUBSTITUTES', enabled: false, bid: 3.0 },
          { key: 'COMPLEMENTS', enabled: true, bid: 3.0 },
        ],
        manualTab: 'KEYWORDS',
        keywords: [],
        targets: [],
      },
      negatives: {
        keywords: [],
        brands: [],
        asins: [],
      },
    };

    const payload = toPayload(draft, MOCK_RULES);

    assert.strictEqual(payload.site, 'AMAZON_BUSINESS');
    assert.strictEqual(payload.bidding_strategy, 'LEGACY_FOR_SALES');
    assert.strictEqual(payload.end_date, '2026-11-25');
    assert.strictEqual(payload.placement_top_pct, 0);

    const ag = payload.ad_groups[0];
    // default_bid is min of enabled groups (2.5)
    assert.strictEqual(ag.default_bid, 2.5);
    // only enabled groups (3 of them)
    assert.strictEqual(ag.targets.length, 3);
    assert.strictEqual(ag.targets[0].value, 'CLOSE_MATCH');
    assert.strictEqual(ag.targets[0].bid, 4.5);
    assert.strictEqual(ag.targets[1].value, 'LOOSE_MATCH');
    assert.strictEqual(ag.targets[1].bid, 2.5);
    assert.strictEqual(ag.targets[2].value, 'COMPLEMENTS');
    assert.strictEqual(ag.targets[2].bid, 3.0);
  });

  it('maps Manual campaign with keywords, product targets and negatives correctly', () => {
    const draft: CampaignDraft = {
      version: 1,
      accountId: 15,
      step: 5,
      maxStepReached: 5,
      details: {
        name: 'Manual Campaign with Negatives',
        startDate: '2026-11-01',
        endDate: null,
        dailyBudget: 500,
        monthlyPlan: false,
        monthlyBudget: null,
        targetAcos: 20,
        adGroupName: 'Manual Keywords AG',
        site: 'AMAZON_AND_BEYOND',
        targetingType: 'MANUAL',
        strategy: 'MANUAL',
        placements: { top: 50, rest: 20, productPage: 15 },
      },
      products: {
        selected: [
          { id: 301, asin: 'B07XYZ1234', title: 'Running Shoes Pro', image_url: null, price: 3499 },
        ],
      },
      targeting: {
        bidMode: 'DEFAULT',
        defaultBid: 5.0,
        autoGroups: [],
        manualTab: 'KEYWORDS',
        keywords: [
          { id: '1', text: 'running shoes', match: 'BROAD', bid: 4.0 },
          { id: '2', text: 'marathon shoes', match: 'EXACT', bid: 6.5 },
        ],
        targets: [
          { id: '3', kind: 'ASIN', value: 'B099999999', bid: 5.5 },
        ],
      },
      negatives: {
        keywords: [
          { id: 'nk1', text: 'cheap running shoes', match: 'NEGATIVE_EXACT' },
          { id: 'nk2', text: 'free', match: 'NEGATIVE_PHRASE' },
        ],
        brands: ['CompetitorBrandA', 'CompetitorBrandB'],
        asins: ['B011111111'],
      },
    };

    const payload = toPayload(draft, MOCK_RULES);

    assert.strictEqual(payload.targeting_type, 'MANUAL');
    assert.strictEqual(payload.bidding_strategy, 'MANUAL');
    assert.strictEqual(payload.placement_top_pct, 50);
    assert.strictEqual(payload.placement_rest_pct, 20);
    assert.strictEqual(payload.placement_product_page_pct, 15);

    const ag = payload.ad_groups[0];
    assert.strictEqual(ag.default_bid, 5.0);
    assert.strictEqual(ag.keywords.length, 2);
    assert.strictEqual(ag.keywords[0].keyword_text, 'running shoes');
    assert.strictEqual(ag.keywords[0].match_type, 'BROAD');
    assert.strictEqual(ag.keywords[0].bid, 4.0);

    assert.strictEqual(ag.targets.length, 1);
    assert.strictEqual(ag.targets[0].kind, 'ASIN');
    assert.strictEqual(ag.targets[0].value, 'B099999999');
    assert.strictEqual(ag.targets[0].bid, 5.5);

    // Negative keywords
    assert.strictEqual(payload.negative_keywords.length, 2);
    assert.strictEqual(payload.negative_keywords[0].keyword_text, 'cheap running shoes');
    assert.strictEqual(payload.negative_keywords[0].match_type, 'NEGATIVE_EXACT');
    assert.strictEqual(payload.negative_keywords[1].match_type, 'NEGATIVE_PHRASE');

    // Negative brands and ASINs
    assert.deepStrictEqual(payload.negative_brands, ['CompetitorBrandA', 'CompetitorBrandB']);
    assert.deepStrictEqual(payload.negative_asins, ['B011111111']);
  });
});
