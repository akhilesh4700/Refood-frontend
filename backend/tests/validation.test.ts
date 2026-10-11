import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../src/modules/auth/auth.schemas';
import { createListingSchema } from '../src/modules/listings/listings.schemas';

describe('Zod Request Validation Schemas', () => {
  describe('Registration Schema', () => {
    it('should successfully validate and normalize valid registration data', () => {
      const input = {
        email: '  Chef.Admin@GrandHotel.COM ',
        password: 'securePassword123',
        name: 'Chef Marcus',
        role: 'supplier',
        orgName: 'Grand Hotel',
        orgType: 'Commercial Hotel Kitchen',
        address: '100 Residency Road',
        city: 'Bengaluru',
        phone: '+91 9876543210',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('chef.admin@grandhotel.com');
        expect(result.data.role).toBe('SUPPLIER');
      }
    });

    it('should reject invalid email format', () => {
      const input = {
        email: 'invalid-email-not-valid',
        password: 'securePassword123',
        name: 'Chef Marcus',
        role: 'supplier',
        orgName: 'Grand Hotel',
        orgType: 'Kitchen',
        address: '100 Residency Road',
        city: 'Bengaluru',
        phone: '+91 9876543210',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject short password less than 6 characters', () => {
      const input = {
        email: 'chef@grandhotel.com',
        password: '123',
        name: 'Chef Marcus',
        role: 'supplier',
        orgName: 'Grand Hotel',
        orgType: 'Kitchen',
        address: '100 Residency Road',
        city: 'Bengaluru',
        phone: '+91 9876543210',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject missing organization details', () => {
      const input = {
        email: 'chef@grandhotel.com',
        password: 'securePassword123',
        name: 'Chef Marcus',
        role: 'supplier',
        orgName: '',
        orgType: '',
        address: '',
        city: '',
        phone: '',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('Listing Food-Safety & Lifecycle Validation', () => {
    const validEdibleListing = {
      title: 'Surplus Catering Trays',
      description: 'Chilled buffet surplus packaged in food-grade GN containers',
      type: 'edible',
      category: 'Prepared Meals',
      weightKg: 25.5,
      storageMethod: 'refrigerated',
      allergens: ['Dairy', 'Gluten'],
      safeUntil: new Date(Date.now() + 6 * 3600000).toISOString(),
      earliestPickup: new Date().toISOString(),
      collectionDeadline: new Date(Date.now() + 4 * 3600000).toISOString(),
      pickupAddress: 'Dock 2, 450 Grand Ave',
      onSiteContact: 'Chef Vance',
      onSitePhone: '+91 9988776655',
    };

    it('should validate compliant edible surplus listing', () => {
      const result = createListingSchema.safeParse(validEdibleListing);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('EDIBLE');
        expect(result.data.storageMethod).toBe('REFRIGERATED');
      }
    });

    it('should REJECT edible listing without safeUntil consumption deadline', () => {
      const invalid = { ...validEdibleListing, safeUntil: undefined };
      const result = createListingSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should REJECT listing with non-positive weight', () => {
      const invalid = { ...validEdibleListing, weightKg: -10 };
      const result = createListingSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should accept organic biomass without safeUntil', () => {
      const organicListing = {
        title: 'Vegetable Trimmings & Peels',
        description: 'Clean pre-consumer prep scraps for bio-conversion',
        type: 'organic',
        category: 'Compost Material',
        weightKg: 80,
        storageMethod: 'ambient',
        earliestPickup: new Date().toISOString(),
        collectionDeadline: new Date(Date.now() + 24 * 3600000).toISOString(),
        pickupAddress: 'Compost bay, 450 Grand Ave',
        onSiteContact: 'Facility Manager',
        onSitePhone: '+91 9988776655',
      };

      const result = createListingSchema.safeParse(organicListing);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('ORGANIC');
      }
    });
  });
});
