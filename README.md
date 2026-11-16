# otel-demo-tests-11-ui

Cypress UI tests for the [OpenTelemetry demo](https://github.com/open-telemetry/opentelemetry-demo) storefront. 4 specs, 9 tests.

This repo owns the UI. A test that drives the storefront in a browser belongs here, whatever area of the API the change touches. API tests belong in the area repos:

| Repo | Area | Covers |
|---|---|---|
| `otel-demo-tests-01` | currency | GET /api/currency, the supported currencies |
| `otel-demo-tests-02` | product-list | GET /api/products, the catalog in a currency |
| `otel-demo-tests-03` | product-detail | GET /api/products/{id}, one product in a currency |
| `otel-demo-tests-04` | cart | POST, GET and DELETE /api/cart, the cart's contents |
| `otel-demo-tests-05` | cart-pricing | GET /api/cart?currencyCode=, cart prices in a currency |
| `otel-demo-tests-06` | shipping | GET /api/shipping, shipping quotes |
| `otel-demo-tests-07` | checkout | POST /api/checkout, placing orders |
| `otel-demo-tests-08` | payment | POST /api/checkout with a card the payment service declines |
| `otel-demo-tests-09` | recommendations | GET /api/recommendations, related products |
| `otel-demo-tests-10` | ads | GET /api/data, ads for a category |
| `otel-demo-tests-11-ui` | ui | the storefront in a browser, Cypress (not generated) |

The specs were moved here from the demo's `src/frontend/cypress/`. The demo's `data-cy` names are copied in `cypress/support/fields.ts`: keep them in step with `src/frontend/utils/enums/CypressFields.ts` in the demo.

## Run

```sh
npm ci
OTEL_DEMO_URL=http://localhost:8080 npx cypress run
```

`OTEL_DEMO_URL` defaults to `http://localhost:8080`. `CheckoutPaymentFailure.cy.ts` toggles the demo's feature flags and turns them off afterwards, so run the specs one after another.

## Known failures at the fixture base

Against pellepedro-testbot/opentelemetry-demo at aa8f9c9 (eval/repo62-base), 4 of the 9 tests pass. The 5 below failed there before the move too, with the same errors:

- `Checkout.cy.ts`: should create an order with two items
- `CheckoutPaymentFailure.cy.ts`: both tests (the base answers 200, not 422 or 500)
- `Home.cy.ts`: should recover corrupted stored session
- `ProductDetail.cy.ts`: should not render product picture when picture is missing
