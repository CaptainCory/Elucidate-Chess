CREATE POLICY "Authenticated users can update puzzles"
ON public.puzzles
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can delete puzzles"
ON public.puzzles
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);