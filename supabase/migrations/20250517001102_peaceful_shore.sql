/*
  # Create saved products table

  1. New Tables
    - `saved_products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `product_data` (jsonb, stores complete product information)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `saved_products` table
    - Add policy for authenticated users to read their own saved products
    - Add policy for authenticated users to create their own saved products
    - Add policy for authenticated users to delete their own saved products
*/

CREATE TABLE IF NOT EXISTS saved_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  product_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved products"
  ON saved_products
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saved products"
  ON saved_products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved products"
  ON saved_products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);