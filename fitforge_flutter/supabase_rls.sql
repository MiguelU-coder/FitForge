-- =====================================================
-- FITFORGE: Row Level Security (RLS) Policies for Supabase
-- =====================================================
-- Ejecuta este SQL en el SQL Editor de Supabase Dashboard
-- https://ilkdhwvmtdgobuoqcfbv.supabase.co
-- =====================================================

-- =====================================================
-- 1. TABLA: profiles (datos de usuario)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden leer su propio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Crear perfil automáticamente al registrar usuario
-- (Esto se maneja desde la app/trigger, no desde policy)


-- =====================================================
-- 2. TABLA: workout_sessions (entrenamientos)
-- =====================================================

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden ver solo sus propios workouts
CREATE POLICY "Users can view own workouts"
ON public.workout_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Usuarios pueden crear sus propios workouts
CREATE POLICY "Users can create own workouts"
ON public.workout_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuarios pueden actualizar sus propios workouts
CREATE POLICY "Users can update own workouts"
ON public.workout_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Usuarios pueden eliminar sus propios workouts
CREATE POLICY "Users can delete own workouts"
ON public.workout_sessions
FOR DELETE
USING (auth.uid() = user_id);


-- =====================================================
-- 3. TABLA: exercise_blocks (bloques de ejercicio)
-- =====================================================

ALTER TABLE public.exercise_blocks ENABLE ROW LEVEL SECURITY;

-- Policy: Leer bloques de workouts propios
CREATE POLICY "Users can view own exercise blocks"
ON public.exercise_blocks
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM workout_sessions
    WHERE id = exercise_blocks.workout_session_id
  )
);

-- Policy: Crear bloques en workouts propios
CREATE POLICY "Users can create own exercise blocks"
ON public.exercise_blocks
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM workout_sessions
    WHERE id = exercise_blocks.workout_session_id
  )
);

-- Policy: Actualizar bloques de workouts propios
CREATE POLICY "Users can update own exercise blocks"
ON public.exercise_blocks
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM workout_sessions
    WHERE id = exercise_blocks.workout_session_id
  )
);

-- Policy: Eliminar bloques de workouts propios
CREATE POLICY "Users can delete own exercise blocks"
ON public.exercise_blocks
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM workout_sessions
    WHERE id = exercise_blocks.workout_session_id
  )
);


-- =====================================================
-- 4. TABLA: set_logs (series registradas)
-- =====================================================

ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Leer series de workouts propios
CREATE POLICY "Users can view own set logs"
ON public.set_logs
FOR SELECT
USING (
  auth.uid() IN (
    SELECT ws.user_id FROM workout_sessions ws
    JOIN exercise_blocks eb ON eb.workout_session_id = ws.id
    WHERE eb.id = set_logs.exercise_block_id
  )
);

-- Policy: Crear series en workouts propios
CREATE POLICY "Users can create own set logs"
ON public.set_logs
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT ws.user_id FROM workout_sessions ws
    JOIN exercise_blocks eb ON eb.workout_session_id = ws.id
    WHERE eb.id = set_logs.exercise_block_id
  )
);

-- Policy: Actualizar series de workouts propios
CREATE POLICY "Users can update own set logs"
ON public.set_logs
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT ws.user_id FROM workout_sessions ws
    JOIN exercise_blocks eb ON eb.workout_session_id = ws.id
    WHERE eb.id = set_logs.exercise_block_id
  )
);

-- Policy: Eliminar series de workouts propios
CREATE POLICY "Users can delete own set logs"
ON public.set_logs
FOR DELETE
USING (
  auth.uid() IN (
    SELECT ws.user_id FROM workout_sessions ws
    JOIN exercise_blocks eb ON eb.workout_session_id = ws.id
    WHERE eb.id = set_logs.exercise_block_id
  )
);


-- =====================================================
-- 5. TABLA: workout_templates (plantillas de entrenamiento)
-- =====================================================

ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Leer plantillas propias
CREATE POLICY "Users can view own templates"
ON public.workout_templates
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Crear plantillas propias
CREATE POLICY "Users can create own templates"
ON public.workout_templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Actualizar plantillas propias
CREATE POLICY "Users can update own templates"
ON public.workout_templates
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Eliminar plantillas propias
CREATE POLICY "Users can delete own templates"
ON public.workout_templates
FOR DELETE
USING (auth.uid() = user_id);


-- =====================================================
-- 6. TABLA: template_blocks (bloques en plantillas)
-- =====================================================

ALTER TABLE public.template_blocks ENABLE ROW LEVEL SECURITY;

-- Policy: Leer bloques de plantillas propias
CREATE POLICY "Users can view own template blocks"
ON public.template_blocks
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM workout_templates
    WHERE id = template_blocks.template_id
  )
);

-- Policy: Crear bloques en plantillas propias
CREATE POLICY "Users can create own template blocks"
ON public.template_blocks
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM workout_templates
    WHERE id = template_blocks.template_id
  )
);

-- Policy: Actualizar bloques de plantillas propias
CREATE POLICY "Users can update own template blocks"
ON public.template_blocks
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM workout_templates
    WHERE id = template_blocks.template_id
  )
);

-- Policy: Eliminar bloques de plantillas propias
CREATE POLICY "Users can delete own template blocks"
ON public.template_blocks
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM workout_templates
    WHERE id = template_blocks.template_id
  )
);


-- =====================================================
-- 7. TABLA: user_metrics (métricas corporales)
-- =====================================================

ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Leer métricas propias
CREATE POLICY "Users can view own metrics"
ON public.user_metrics
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Crear métricas propias
CREATE POLICY "Users can create own metrics"
ON public.user_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Actualizar métricas propias
CREATE POLICY "Users can update own metrics"
ON public.user_metrics
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Eliminar métricas propias
CREATE POLICY "Users can delete own metrics"
ON public.user_metrics
FOR DELETE
USING (auth.uid() = user_id);


-- =====================================================
-- FUNCIONES AUXILIARES (para triggers)
-- =====================================================

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Usuario'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar al crear usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =====================================================
-- NOTA: TABLAS REQUERIDAS
-- =====================================================
-- Este SQL asume que ya existen las siguientes tablas en tu Supabase:
--
-- 1. profiles (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
--     email TEXT,
--     display_name TEXT,
--     weight_kg DECIMAL,
--     height_cm DECIMAL,
--     goal_weight_kg DECIMAL,
--     level TEXT,
--     goal TEXT,
--     activities TEXT[],
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW()
--   )
--
-- 2. workout_sessions (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--     name TEXT,
--     started_at TIMESTAMPTZ DEFAULT NOW(),
--     finished_at TIMESTAMPTZ,
--     duration_seconds INT,
--     perceived_exertion INT,
--     body_weight_kg DECIMAL,
--     notes TEXT,
--     created_at TIMESTAMPTZ DEFAULT NOW()
--   )
--
-- 3. exercise_blocks (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
--     exercise_id TEXT,
--     exercise_name TEXT,
--     primary_muscles TEXT[],
--     is_unilateral BOOLEAN DEFAULT false,
--     sort_order INT,
--     image_url TEXT,
--     created_at TIMESTAMPTZ DEFAULT NOW()
--   )
--
-- 4. set_logs (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     exercise_block_id UUID REFERENCES exercise_blocks(id) ON DELETE CASCADE,
--     set_number INT,
--     set_type TEXT,
--     weight_kg DECIMAL,
--     weight_kg_left DECIMAL,
--     weight_kg_right DECIMAL,
--     reps INT,
--     reps_left INT,
--     reps_right INT,
--     rir INT,
--     rpe DECIMAL,
--     duration_seconds INT,
--     distance_m DECIMAL,
--     is_pr BOOLEAN DEFAULT false,
--     is_failed BOOLEAN DEFAULT false,
--     completed_at TIMESTAMPTZ,
--     created_at TIMESTAMPTZ DEFAULT NOW()
--   )
--
-- 5. workout_templates (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--     name TEXT,
--     description TEXT,
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW()
--   )
--
-- 6. template_blocks (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
--     exercise_id TEXT,
--     exercise_name TEXT,
--     target_sets INT,
--     target_reps TEXT,
--     rest_seconds INT,
--     notes TEXT,
--     sort_order INT,
--     created_at TIMESTAMPTZ DEFAULT NOW()
--   )
--
-- 7. user_metrics (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--     weight_kg DECIMAL,
--     measured_at TIMESTAMPTZ DEFAULT NOW(),
--     created_at TIMESTAMPTZ DEFAULT NOW()
--   )
--
-- IMPORTANTE: user_id en cada tabla debe tener:
--   REFERENCES auth.users(id) ON DELETE CASCADE
