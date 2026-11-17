// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

import { getElementByField, CypressFields } from '../support/fields';

const productName = 'National Park Foundation Explorascope';

describe('Cart shipping', () => {
  it('shows the shipping cost and total in the cart and places the order', () => {
    cy.intercept('POST', '/api/cart*').as('addToCart');
    cy.intercept('GET', '/api/shipping*').as('getShipping');
    cy.intercept('POST', '/api/checkout*').as('placeOrder');

    cy.log('Step 1: open the product from the home page');
    cy.visit('/');
    getElementByField(CypressFields.ProductCard).filter(`:contains("${productName}")`).click();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/product/OLJCESPC7Z');
    getElementByField(CypressFields.ProductName).should('have.text', productName);

    cy.log('Step 2: add it to the cart and see the shipping cost');
    getElementByField(CypressFields.ProductQuantity).should('have.value', '1');
    getElementByField(CypressFields.ProductAddToCart).click();
    cy.wait('@addToCart');
    cy.location('pathname', { timeout: 10000 }).should('eq', '/cart');
    cy.wait('@getShipping', { timeout: 15000 }).then(({ request, response }) => {
      const query = new URL(request.url).searchParams;
      expect(JSON.parse(query.get('itemList') ?? 'null')).to.deep.equal([{ productId: 'OLJCESPC7Z', quantity: 1 }]);
      expect(query.get('currencyCode')).to.equal('USD');
      expect(response?.statusCode).to.equal(200);
    });
    cy.contains('div', /^Shipping\s*\$/).should('contain.text', '$ 8.99');

    cy.log('Step 3: read the order total');
    cy.contains('div', /^Total\s*\$/).find('h3').should('contain.text', '$ 110.95');

    cy.log('Step 4: place the order');
    getElementByField(CypressFields.CheckoutPlaceOrder).click();
    cy.wait('@placeOrder', { timeout: 20000 });
    cy.location('pathname', { timeout: 20000 }).should('match', /^\/cart\/checkout\//);
    cy.contains('h1', 'Your order is complete!').should('be.visible');
    cy.contains(productName).should('be.visible');
    cy.contains('Quantity: 1').should('be.visible');
    cy.contains('1600 Amphitheatre Parkway').should('be.visible');
  });
});

export {};
