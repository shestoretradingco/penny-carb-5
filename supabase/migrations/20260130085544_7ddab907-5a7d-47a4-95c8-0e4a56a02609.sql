-- Make service_type nullable and add a new array column for multiple service types
-- Categories with NULL service_type and empty service_types array will be considered "common" (applies to all)

-- Add service_types array column
ALTER TABLE public.food_categories 
ADD COLUMN service_types text[] DEFAULT ARRAY[]::text[];

-- Migrate existing data: copy current service_type to the array
UPDATE public.food_categories 
SET service_types = ARRAY[service_type::text]
WHERE service_type IS NOT NULL;

-- Make service_type nullable (keep for backward compatibility during transition)
ALTER TABLE public.food_categories 
ALTER COLUMN service_type DROP NOT NULL;