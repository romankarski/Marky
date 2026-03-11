// Extend vitest's expect with @testing-library/jest-dom matchers.
// We import matchers directly to avoid the version mismatch between
// the vitest at root node_modules (v2) and client node_modules (v4).
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
