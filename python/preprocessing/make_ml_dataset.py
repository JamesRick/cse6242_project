
import os, re, sys, pdb
# import cpi
import datetime, traceback
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

preprocessing_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(preprocessing_dir))
zillow_dir = os.path.join(root_dir, "zillow_data")
data_dir = os.path.join(zillow_dir, "ga_preprocessed")
print(preprocessing_dir, flush=True)
print(zillow_dir, flush=True)
print(data_dir, flush=True)

informer_data_dir = os.path.join(root_dir, "Informer2020", "data", "ga_preprocessed")
print(informer_data_dir, flush=True)
print("", flush=True)


csv_filepath_list = [
    os.path.join(data_dir, "all_sm_sa_month", "County_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"),
    os.path.join(data_dir, "bdrmcnt_2_uc_sfrcondo", "County_zhvi_bdrmcnt_2_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"),
    os.path.join(data_dir, "condo_sm_sa_month", "County_zhvi_uc_condo_tier_0.33_0.67_sm_sa_month.csv"),
    os.path.join(data_dir, "sfr_sm_sa_month", "County_zhvi_uc_sfr_tier_0.33_0.67_sm_sa_month.csv"),
    os.path.join(data_dir, "zori_sm_sa_month", "County_zori_sm_sa_month.csv"),
]

# start_date = "2000-01-31"
# end_date = "2022-09-30"

drop_cols = [
    'StateCodeFIPS',
    'MunicipalCodeFIPS',
    'RegionID',
    'SizeRank',
    'RegionType',
    'StateName',
    'State',
    'Metro',
]

def make_dataset():
    for csv_filepath in csv_filepath_list:
        print(os.path.basename(csv_filepath), flush=True)

        df = pd.read_csv(csv_filepath)
        df = df.drop(columns=[x for x in df.keys() if "Unnamed" in x])

        df = df.drop(columns=drop_cols)
        df.loc[:, "RegionName"] = df.apply(lambda x: re.sub(" County", "", x['RegionName']), axis=1)
        df = df.set_index(df['RegionName'].values).drop(columns="RegionName").T

        cur_dat_dir = os.path.basename(os.path.dirname(csv_filepath))
        cur_out_filename = os.path.splitext(os.path.basename(csv_filepath))[0] + "_ml_dataset.csv"
        output_filepath = os.path.join(informer_data_dir, cur_dat_dir, cur_out_filename)

        print(output_filepath, flush=True)

        df.to_csv(output_filepath)
    print("Complete", flush=True)

if __name__ == '__main__':
    make_dataset()