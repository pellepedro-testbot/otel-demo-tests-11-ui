// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'cypress';

const baseUrl = process.env.OTEL_DEMO_URL ?? 'http://localhost:8080';

export default defineConfig({
  env: { baseUrl },
  e2e: {
    baseUrl,
    supportFile: false,
  },
});
