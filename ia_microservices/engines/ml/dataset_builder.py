# ai-service/engines/ml/dataset_builder.py
"""
Data Pipeline for Progressive Overload.
Transforms raw workout history JSON into structured numpy arrays
for scikit-learn training.
"""
import numpy as np
from typing import Tuple
from schemas.workout_schema import ExerciseHistoryEntry, SetType


def build_progression_dataset(history: list[ExerciseHistoryEntry]) -> Tuple[np.ndarray, np.ndarray]:
    """
    Builds a temporal dataset for a specific user and exercise.
    
    Features (X): [session_index, set_number, weight_kg, reps]
    Target (y): [rir]
    
    Returns:
        X (np.ndarray): Shape (n_samples, 4)
        y (np.ndarray): Shape (n_samples,)
    """
    # Sort from oldest to newest to capture temporal adaptation
    sessions_asc = sorted(history, key=lambda x: x.session_date)
    
    X = []
    y = []
    
    for session_idx, session in enumerate(sessions_asc):
        # Filter working sets
        working_sets = [
            s for s in session.sets 
            if s.set_type == SetType.WORKING 
            and s.weight_kg is not None 
            and s.reps is not None 
            and s.rir is not None
        ]
        
        for set_idx, s in enumerate(working_sets):
            # Model how difficulty (RIR) behaves based on session age, set order, weight, and reps
            X.append([
                session_idx,      # Temporal adaptation marker
                set_idx + 1,      # Intra-workout fatigue marker
                float(s.weight_kg), # Mechanical load
                float(s.reps)       # Volume load
            ])
            y.append(float(s.rir))
            
    return np.array(X), np.array(y)
