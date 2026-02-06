-- Fix the existing Cloud Kitchen order by creating cook assignment
-- Only insert into order_assigned_cooks which is what the cook dashboard checks
INSERT INTO order_assigned_cooks (order_id, cook_id, cook_status, assigned_at)
VALUES (
  '3765dc15-5412-4b39-9af8-5f1447615d95',
  '6b0767cf-6004-43bb-a7e8-7e6a4a625a0f',
  'pending',
  now()
) ON CONFLICT DO NOTHING;