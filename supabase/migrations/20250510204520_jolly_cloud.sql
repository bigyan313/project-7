/*
  # Create saved outfits table

  1. New Tables
    - `saved_outfits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `outfit_data` (jsonb, stores complete outfit information)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `saved_outfits` table
    - Add policy for authenticated users to read their own saved outfits
    - Add policy for authenticated users to create their own saved outfits
    - Add policy for authenticated users to delete their own saved outfits
*/

CREATE TABLE IF NOT EXISTS saved_outfits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  outfit_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved outfits"
  ON saved_outfits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saved outfits"
  ON saved_outfits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved outfits"
  ON saved_outfits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);