import numpy as np

import ctypes
import numpy.ctypeslib as npct

libc = ctypes.CDLL("./lib.so")




if (__name__ == "__main__"):
    # a=a.astype(np.float32)
    # b=200;
    # b=b.astype(np.float32)
    print(libc.collisionMap(np.ctypeslib.as_ctypes(np.float64(0)), np.ctypeslib.as_ctypes(np.float64(0)),0))

