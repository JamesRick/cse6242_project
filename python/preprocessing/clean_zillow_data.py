
import os, re, sys, pdb, cpi
import datetime, traceback
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

preprocessing_dir = os.path.dirname(os.path.abspath(__file__))
zillow_dir = os.path.join(os.path.dirname(os.path.dirname(preprocessing_dir)), "zillow_data")
print(preprocessing_dir, flush=True)
print(zillow_dir, flush=True)

# start_date = "2000-01-31"
# end_date = "2022-09-30"

def filter_to_georgia(**kwargs):
    us_dir = os.path.join(zillow_dir, "us")
    print(us_dir, flush=True)
    print(os.listdir(us_dir), flush=True)
    
    for csv_dir in os.listdir(us_dir):
        csv_dir = os.path.join(us_dir, csv_dir)
        for csv_path in os.listdir(csv_dir):
            csv_filepath = os.path.join(csv_dir, csv_path)
            print(csv_filepath, flush=True)
            df = pd.read_csv(csv_filepath)
            mask = (df["StateName"] == "GA").values
            output_path = re.sub("us", "ga", csv_filepath)
            print(output_path, flush=True)
            # os.makedirs(os.path.dirname(output_path), exist_ok=True)
            # df.loc[mask].to_csv(output_path)

def fill_holes_in_data(df, start_date, end_date, **kwargs):
    order = kwargs.get('order', 4)

    cur_series = pd.Series(df.loc[:, start_date:end_date].T.index)
    cur_series = pd.to_datetime(cur_series, yearfirst=True)
    cur_df = df.loc[:, start_date:end_date].T.set_index(cur_series)

    too_few_samples = (~(cur_df.isna())).sum(axis=0)
    order_mask = (too_few_samples > order)
    cubic_mask = (too_few_samples == 4)
    quadratic_mask = (too_few_samples == 3)
    linear_mask = (too_few_samples == 2)

    if np.any(order_mask):
        order_df = cur_df.loc[:, order_mask[order_mask].index.values]
        order_df = order_df.interpolate(method='spline', axis=0, order=order, limit_area='inside').T
        df.loc[order_df.index.values, start_date:end_date] = order_df.values
    if np.any(cubic_mask):
        cubic_df = cur_df.loc[:, cubic_mask[cubic_mask].index.values]
        cubic_df = cubic_df.interpolate(method='spline', axis=0, order=3, limit_area='inside').T
        df.loc[cubic_df.index.values, start_date:end_date] = cubic_df.values
    if np.any(quadratic_mask):
        quadratic_df = cur_df.loc[:, quadratic_mask[quadratic_mask].index.values]
        quadratic_df = quadratic_df.interpolate(method='spline', axis=0, order=2, limit_area='inside').T
        df.loc[quadratic_df.index.values, start_date:end_date] = quadratic_df.values
    if np.any(linear_mask):
        linear_df = cur_df.loc[:, linear_mask[linear_mask].index.values]
        linear_df = linear_df.interpolate(method='spline', axis=0, order=1, limit_area='inside').T
        df.loc[linear_df.index.values, start_date:end_date] = linear_df.values

    return df

def adjust_for_cpi(row):
    reference_date = datetime.datetime.strptime("2022-09-30", "%Y-%m-%d")
    for idx, val in row.items():
        # print(idx, val, flush=True)
        cur_date = datetime.datetime.strptime(idx, "%Y-%m-%d")
        row[idx] = round(cpi.inflate(val, cur_date, to=reference_date), 2)
    return row

def preprocess_data():
    ga_dir = os.path.join(zillow_dir, "ga")
    print(ga_dir, flush=True)
    print(os.listdir(ga_dir), flush=True)
    
    ga_dir_list = os.listdir(ga_dir)
    for dir_idx, csv_dir in enumerate(ga_dir_list):
        print(f"{dir_idx+1} / {len(ga_dir_list)}", flush=True)
        csv_dir = os.path.join(ga_dir, csv_dir)
        csv_dir_list = os.listdir(csv_dir)
        for csv_idx, csv_path in enumerate(csv_dir_list):
            csv_filepath = os.path.join(csv_dir, csv_path)
            print(f"{csv_idx+1} / {len(csv_dir_list)}, {csv_filepath}", flush=True)
            # if dir_idx+1 != 3:
            #     continue
            df = pd.read_csv(csv_filepath)
            date_keys = [datetime.datetime.strptime(x, "%Y-%m-%d") for x in df.keys().values if re.match("[0-9]+-[0-9]+-[0-9]", x)]
            start_date, end_date = datetime.datetime.strftime(min(date_keys), "%Y-%m-%d"), datetime.datetime.strftime(max(date_keys), "%Y-%m-%d")
            print(end_date, flush=True)
            output_path = re.sub("ga", "ga_preprocessed", csv_filepath)
            print(output_path, flush=True)
            filled_df = fill_holes_in_data(df, start_date, end_date)
            # try:
            #     filled_df = fill_holes_in_data(df, start_date, end_date)
            # except Exception as e:
            #     traceback.print_exc()
            #     pdb.set_trace()
            filled_df = filled_df.loc[:, start_date:end_date].apply(lambda x: adjust_for_cpi(x), axis=1)
            df.loc[:, start_date:end_date] = filled_df.loc[:, start_date:end_date].values
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            df.to_csv(output_path)

if __name__ == '__main__':
    preprocess_data()
    # filter_to_georgia()
    # df = pd.read_csv(os.path.join(zillow_dir, "ga/all_sm_sa_month/County_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"))
    # filled_df = fill_holes_in_data(df, start_date, end_date)
    # filled_df = filled_df.apply(lambda x: adjust_for_cpi(x), axis=1)
    # filled_df.T.plot.line()
    # plt.show()