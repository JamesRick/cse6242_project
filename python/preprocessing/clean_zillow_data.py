
import os, re, sys
import numpy as np, pandas as pd

preprocessing_dir = os.path.dirname(os.path.abspath(__file__))
zillow_dir = os.path.join(os.path.dirname(os.path.dirname(preprocessing_dir)), "zillow_data")

if __name__ == '__main__':
    us_dir = os.path.join(zillow_dir, "us")
    
    for csv_dir in os.listdir(us_dir):
        csv_dir = os.path.join(us_dir, csv_dir)
        for csv_path in os.listdir(csv_dir):
            csv_filepath = os.path.join(csv_dir, csv_path)
            df = pd.read_csv(csv_filepath)
            mask = (df["StateName"] == "GA").values
            output_path = re.sub("/us/", "/ga/", csv_filepath)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            df.loc[mask].to_csv(output_path)