// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

import getSymbolFromCurrency from 'currency-symbol-map';
import { getElementByField, CypressFields } from '../support/fields';

const productId = '0PUK6V6EV0';
const productName = 'Solar System Color Imager';
const quoteParams = {
  itemList: JSON.stringify([{ productId: 'LS4PSXUNUM', quantity: 1 }]),
  currencyCode: 'EUR',
  address: JSON.stringify({
    streetAddress: '1600 Amphitheatre Parkway',
    zipCode: '94043',
    city: 'Mountain View',
    state: 'CA',
    country: 'United States',
  }),
};

describe('Unsupported methods while shopping in another currency', () => {
  let userId: string | undefined;
  const failures: string[] = [];

  const expectRefused = (
    step: string,
    method: string,
    url: string,
    allow: string,
    extra: Partial<Cypress.RequestOptions> = {}
  ) =>
    cy
      .request({ method, url, failOnStatusCode: false, timeout: 5000, ...extra })
      .then(({ status, headers, body, duration }) => {
        const label = `${step}: ${method} ${url}`;
        if (status !== 405) failures.push(`${label} answered ${status}, not 405`);
        if (headers['allow'] !== allow) failures.push(`${label} Allow was ${JSON.stringify(headers['allow'])}, not "${allow}"`);
        if (body !== '' && body !== undefined) failures.push(`${label} body was ${JSON.stringify(body)}, not empty`);
        if (duration >= 5000) failures.push(`${label} took ${duration} ms`);
      });

  const readCart = () =>
    cy
      .then(() => cy.request({ url: '/api/cart', qs: { sessionId: userId } }))
      .then(({ body }) =>
        (body.items as { productId: string; quantity: number }[]).map(i => [i.productId, i.quantity])
      );

  after(() => {
    if (userId) cy.request({ method: 'DELETE', url: '/api/cart', body: { userId }, failOnStatusCode: false });
  });

  it('refuses unsupported methods at once and leaves the cart and quotes as they were', () => {
    cy.intercept('GET', '/api/currency*').as('getCurrency');
    cy.intercept('POST', '/api/cart*').as('addToCart');
    cy.intercept('GET', '/api/shipping*').as('getShipping');

    cy.log('Step 1: pick EUR from the currency list');
    cy.visit('/');
    cy.wait('@getCurrency').its('response.statusCode').should('eq', 200);
    getElementByField(CypressFields.CurrencySwitcher).find('option').should('have.length', 33);
    getElementByField(CypressFields.CurrencySwitcher).select('EUR');
    getElementByField(CypressFields.CurrencySwitcher).should('have.value', 'EUR');

    cy.log('Step 2: unsupported methods on /api/currency');
    ['PUT', 'POST', 'DELETE', 'PATCH'].forEach(method =>
      expectRefused('Step 2', method, '/api/currency', 'GET')
    );
    getElementByField(CypressFields.CurrencySwitcher).should('have.value', 'EUR');

    cy.log('Step 3: open a product');
    getElementByField(CypressFields.ProductCard).filter(`:contains("${productName}")`).click();
    cy.location('pathname').should('eq', `/product/${productId}`);
    getElementByField(CypressFields.ProductName).should('have.text', productName);
    getElementByField(CypressFields.ProductAddToCart).should('be.visible');

    cy.log('Step 4: add it to the cart');
    getElementByField(CypressFields.ProductAddToCart).click();
    cy.wait('@addToCart').its('response.statusCode').should('eq', 200);
    cy.location('pathname', { timeout: 10000 }).should('eq', '/cart');
    cy.contains('h1', 'Shopping Cart').should('be.visible');
    cy.contains(`a[href="/product/${productId}"]`, productName).should('be.visible');

    cy.log('Step 5: PUT and PATCH /api/cart leave the cart as it was');
    cy.window().then(win => {
      userId = JSON.parse(win.localStorage.getItem('session') ?? '{}').userId;
      expect(userId, 'session userId').to.be.a('string');
    });
    readCart().should('deep.equal', [[productId, 1]]);
    ['PUT', 'PATCH'].forEach(method =>
      cy.then(() =>
        expectRefused('Step 5', method, '/api/cart', 'GET, POST, DELETE', {
          body: { userId, item: { productId: '66VCHSJNUP', quantity: 3 } },
        })
      )
    );
    readCart().then(items => {
      if (JSON.stringify(items) !== JSON.stringify([[productId, 1]]))
        failures.push(`Step 5: cart after PUT and PATCH was ${JSON.stringify(items)}`);
    });
    cy.reload();
    cy.contains(`a[href="/product/${productId}"]`, productName).should('be.visible');
    cy.contains('a[href^="/product/"] p', 'Starsense Explorer Refractor Telescope').should('not.exist');

    cy.log('Step 6: shipping is quoted in EUR; unsupported methods on /api/shipping');
    cy.wait('@getShipping').then(({ request, response }) => {
      expect(new URL(request.url).searchParams.get('currencyCode')).to.eq('EUR');
      expect(response?.statusCode).to.eq(200);
      expect(response?.body.currencyCode).to.eq('EUR');
    });
    cy.contains('div', new RegExp(`^Shipping\\s*${getSymbolFromCurrency('EUR')}\\s*\\d+\\.\\d{2}$`)).should('be.visible');
    expectRefused('Step 6', 'POST', '/api/shipping', 'GET');
    ['POST', 'PUT', 'DELETE', 'PATCH'].forEach(method =>
      expectRefused('Step 6', method, '/api/shipping', 'GET', { qs: quoteParams })
    );

    cy.log('Step 7: empty the cart');
    cy.contains('button', 'Empty Cart').click();
    cy.contains('Your shopping cart is empty').should('be.visible');
    readCart().should('deep.equal', []);

    cy.then(() => expect(failures, 'refused requests and cart state').to.deep.equal([]));
  });
});
