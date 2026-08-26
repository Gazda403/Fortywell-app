import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import workoutsLocalSeed from '../assets/workouts_seed.json';

export interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  tempo?: string;
  rest?: string;
  coaching_cue?: string;
  duration?: string;
  notes?: string;
  exercise_db_id?: string;
  image_url?: string;
  gif_url?: string;
}

export interface WorkoutBlock {
  block_name: string;
  exercises: Exercise[];
}

export interface Workout {
  id?: string;
  slug: string;
  title: string;
  description: string;
  equipment: 'home_bodyweight' | 'home_dumbbells_bands' | 'gym_machines_free_weights';
  duration_minutes: number;
  target_focus: string[];
  joint_sensitivities_safe: string[];
  energy_level: 'low' | 'moderate' | 'high';
  warmup: Exercise[];
  main_blocks: WorkoutBlock[];
  cooldown: Exercise[];
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>(workoutsLocalSeed as Workout[]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFromSupabase, setIsFromSupabase] = useState<boolean>(false);

  useEffect(() => {
    async function fetchWorkouts() {
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          setWorkouts(data as Workout[]);
          setIsFromSupabase(true);
        } else {
          // Local fallback seed
          setWorkouts(workoutsLocalSeed as Workout[]);
        }
      } catch (_) {
        setWorkouts(workoutsLocalSeed as Workout[]);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkouts();
  }, []);

  const getWorkoutsByEquipment = (equipment: string) => {
    return workouts.filter((w) => w.equipment === equipment);
  };

  const getWorkoutsForSensitivities = (sensitivities: string[]) => {
    if (!sensitivities || sensitivities.length === 0) return workouts;
    return workouts.filter((w) =>
      sensitivities.some((s) => w.joint_sensitivities_safe.includes(s))
    );
  };

  return {
    workouts,
    loading,
    isFromSupabase,
    getWorkoutsByEquipment,
    getWorkoutsForSensitivities,
  };
}
