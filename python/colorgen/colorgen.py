import numpy as np
import json
from hsluv import hsluv_to_rgb

nrows, ncols = 16, 10

h = np.random.uniform(low=0, high=360, size=(nrows, ncols))
l = np.random.normal(loc=66, scale=10, size=(nrows, ncols))
s = np.random.uniform(low=80, high=100, size=(nrows, ncols))

image = np.dstack((h,s,l))
image = np.apply_along_axis(hsluv_to_rgb, 2, image)

img_int = (image.reshape(160, 3) * 255).astype(int)

def rgb_to_hex(rgb):
    return '%02x%02x%02x' % rgb

x = []
for row in img_int: 
    x.append('#' + rgb_to_hex(tuple(row)))

print(json.dumps(x))