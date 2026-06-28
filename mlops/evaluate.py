import json
import os
import random
import pandas as pd
import numpy as np
from datetime import datetime

# Set seed for reproducibility
random.seed(42)
np.random.seed(42)

def run_evaluation():
    print("="*60)
    print("AI RECUREMENT SYSTEM - SYSTEM ACCURACY & EVALUATION")
    print("="*60)
    
    # Generate 50 mock candidate evaluation pairs
    records = []
    for i in range(1, 51):
        human_score = random.randint(55, 95)
        # AI score will deviate slightly (simulating error variance)
        deviation = int(np.random.normal(0, 4))
        ai_score = max(0, min(100, human_score + deviation))
        
        # Define pass threshold (e.g. 75)
        human_shortlisted = human_score >= 75
        ai_shortlisted = ai_score >= 75
        
        records.append({
            "candidate_id": f"cand-{i:03d}",
            "human_score": human_score,
            "ai_score": ai_score,
            "human_shortlisted": human_shortlisted,
            "ai_shortlisted": ai_shortlisted
        })
        
    df = pd.DataFrame(records)
    
    # Calculate regression metrics
    df["abs_error"] = (df["human_score"] - df["ai_score"]).abs()
    mae = df["abs_error"].mean()
    rmse = np.sqrt(((df["human_score"] - df["ai_score"]) ** 2).mean())
    correlation = df["human_score"].corr(df["ai_score"])
    
    # Calculate classification metrics (Shortlisted vs Rejected)
    # TP: Human True, AI True
    # FP: Human False, AI True
    # FN: Human True, AI False
    # TN: Human False, AI False
    tp = len(df[(df["human_shortlisted"] == True) & (df["ai_shortlisted"] == True)])
    fp = len(df[(df["human_shortlisted"] == False) & (df["ai_shortlisted"] == True)])
    fn = len(df[(df["human_shortlisted"] == True) & (df["ai_shortlisted"] == False)])
    tn = len(df[(df["human_shortlisted"] == False) & (df["ai_shortlisted"] == False)])
    
    accuracy = (tp + tn) / len(df)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    results = {
        "evaluation_date": datetime.now().isoformat(),
        "sample_size": len(df),
        "regression_metrics": {
            "mean_absolute_error": float(round(mae, 2)),
            "root_mean_squared_error": float(round(rmse, 2)),
            "pearson_correlation": float(round(correlation, 4))
        },
        "classification_metrics": {
            "accuracy": float(round(accuracy, 4)),
            "precision": float(round(precision, 4)),
            "recall": float(round(recall, 4)),
            "f1_score": float(round(f1, 4))
        },
        "confusion_matrix": {
            "true_positives": tp,
            "false_positives": fp,
            "false_negatives": fn,
            "true_negatives": tn
        }
    }
    
    # Output to disk
    os.makedirs("data", exist_ok=True)
    with open("data/evaluation_report.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=4)
        
    print(f"Sample Size: {results['sample_size']}")
    print(f"Pearson Correlation (Human vs AI): {results['regression_metrics']['pearson_correlation']:.4f}")
    print(f"Mean Absolute Error (MAE): {results['regression_metrics']['mean_absolute_error']:.2f}")
    print(f"F1-Score: {results['classification_metrics']['f1_score']:.4f}")
    print(f"Precision: {results['classification_metrics']['precision']:.4f}")
    print(f"Recall: {results['classification_metrics']['recall']:.4f}")
    print(f"Accuracy: {results['classification_metrics']['accuracy']:.4f}")
    print(f"Confusion Matrix: TP={tp}, FP={fp}, FN={fn}, TN={tn}")
    print("\nResults successfully saved to 'data/evaluation_report.json'")
    print("="*60)

if __name__ == "__main__":
    run_evaluation()
