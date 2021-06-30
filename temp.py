import ctypes

libc = ctypes.CDLL("./lib.so")


if __name__ == "__main__":
    # a=a.astype(np.float32)
    # b=200;
    # b=b.astype(np.float32)
    a = ctypes.c_double(90)
    b = ctypes.c_double(0)
    ret = libc.collisionMap(a, b, 0)
    print(ret >> 16, ret & 65535)
