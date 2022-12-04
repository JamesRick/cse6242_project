import sys
import json
import random
import math
from typing import List

letters = [*'0123456789ABCDEF']
# function getRandomHex() {
#     var letters = '0123456789ABCDEF'.split('');
#     var color = '#';
#     for (var i = 0; i < 6; i++ ) {
#         color += letters[Math.floor(Math.random() * 16)];
#     }
#     return color;
# }

def get_random_hex(k) -> str: 
    color = '#' 
    random.seed(k)
    for _ in range(6): 
        color += letters[math.floor(random.random() * 16)]
    return color

def get_n_colors(n: int) -> List[str]: 
    return [get_random_hex(s) for s in range(n)]


if __name__ == '__main__': 
    n_colors = int(sys.argv[1])
    print(json.dumps(get_n_colors(n_colors)))