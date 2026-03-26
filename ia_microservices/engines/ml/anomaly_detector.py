# ai-service/engines/ml/anomaly_detector.py
"""
Anomaly Filter using Isolation Forest.
Detects and removes corrupted, mistyped, or impossible sets 
that would poison the ML prediction model.
"""
import numpy as np
from sklearn.ensemble import IsolationForest
import structlog

logger = structlog.get_logger()

def filter_anomalous_sets(X: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Fit an IsolationForest to detect outliers in the training data (weight & reps).
    If a user accidentally logs a 500kg bicep curl, this will remove it.
    
    Args:
        X: Feature matrix [session, set_num, weight, reps]
        y: Target array [rir]
        
    Returns:
        Clean X and clean y.
    """
    # We need at least 10 samples to statistically define an "outlier"
    if len(X) < 10:
        return X, y
        
    try:
        # Contamination: Assume roughly 5% of logged sets might be typos or outliers
        iso = IsolationForest(contamination=0.05, random_state=42)
        
        # We only fit the forest on columns 2 and 3 (weight and reps)
        # Because session index and set number are deterministic, not performance metrics.
        features_to_check = X[:, 2:4]
        
        # Predict: 1 for inliers, -1 for outliers
        preds = iso.fit_predict(features_to_check)
        mask = preds == 1
        
        outliers_count = np.sum(preds == -1)
        if outliers_count > 0:
            logger.info("anomaly_detector.filtered", outliers_removed=int(outliers_count))
            
        return X[mask], y[mask]
        
    except Exception as e:
        logger.error("anomaly_detector.error", error=str(e))
        # Fallback: return raw data on error
        return X, y
