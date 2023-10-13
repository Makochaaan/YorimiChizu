from cgitb import html
import numpy as np
import random
import math
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import requests
import json
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# index.js, L32より呼び出し、関数を実行。結果をレスポンスとして返す
@app.get("/relaypoint/{a_lat}/{a_lon}/{b_lat}/{b_lon}/types={types}")
async def calc_xy(a_lat: float = 0, a_lon: float = 0, b_lat: float = 0, b_lon: float = 0, types: str = ""):

	rel_place=""
    # 緯度経度・平面直角座標系原点をラジアンに直す
	cen_lat = (a_lat + b_lat) / 2
	cen_lon = (a_lon + b_lon) / 2
	a_lat_rad=np.deg2rad(a_lat)
	a_lon_rad=np.deg2rad(a_lon)
	cen_lat_rad=np.deg2rad(cen_lat)
	cen_lon_rad=np.deg2rad(cen_lon)

    # 補助関数
	def A_array(n):
		A0 = 1 + (n**2)/4. + (n**4)/64.
		A1 = -     (3./2)*( n - (n**3)/8. - (n**5)/64. ) 
		A2 =     (15./16)*( n**2 - (n**4)/4. )
		A3 = -   (35./48)*( n**3 - (5./16)*(n**5) )
		A4 =   (315./512)*( n**4 )
		A5 = -(693./1280)*( n**5 )
		return np.array([A0, A1, A2, A3, A4, A5])
	
	def alpha_array(n):
		a0 = np.nan # dummy
		a1 = (1./2)*n - (2./3)*(n**2) + (5./16)*(n**3) + (41./180)*(n**4) - (127./288)*(n**5)
		a2 = (13./48)*(n**2) - (3./5)*(n**3) + (557./1440)*(n**4) + (281./630)*(n**5)
		a3 = (61./240)*(n**3) - (103./140)*(n**4) + (15061./26880)*(n**5)
		a4 = (49561./161280)*(n**4) - (179./168)*(n**5)
		a5 = (34729./80640)*(n**5)
		return np.array([a0, a1, a2, a3, a4, a5])

    # 定数 (a, F: 世界測地系-測地基準系1980（GRS80）楕円体)
	m0 = 0.9999 
	a = 6378137.
	F = 298.257222101

    # (1) n, A_i, alpha_iの計算
	n = 1. / (2*F - 1)
	A_array = A_array(n)
	alpha_array = alpha_array(n)

    # (2), S, Aの計算
	A_ = ( (m0*a)/(1.+n) )*A_array[0] # [m]
	S_ = ( (m0*a)/(1.+n) )*( A_array[0]*cen_lat_rad + np.dot(A_array[1:], np.sin(2*cen_lat_rad*np.arange(1,6))) ) # [m]

    # (3) lambda_c, lambda_sの計算
	lambda_c = np.cos(a_lon_rad - cen_lon_rad)
	lambda_s = np.sin(a_lon_rad - cen_lon_rad)

    # (4) t, t_の計算
	t = np.sinh( np.arctanh(np.sin(a_lat_rad)) - ((2*np.sqrt(n)) / (1+n))*np.arctanh(((2*np.sqrt(n)) / (1+n)) * np.sin(a_lat_rad)) )
	t_ = np.sqrt(1 + t*t)

    # (5) xi', eta'の計算
	xi1  = np.arctan(t / lambda_c) # [rad]
	eta1 = np.arctanh(lambda_s / t_)

    # (6) x, yの計算
	x = A_ * (xi1 + np.sum(np.multiply(alpha_array[1:],
                                       np.multiply(np.sin(2*xi1*np.arange(1,6)),
                                                   np.cosh(2*eta1*np.arange(1,6)))))) - S_ # [m]
	y = A_ * (eta1 + np.sum(np.multiply(alpha_array[1:],
                                        np.multiply(np.cos(2*xi1*np.arange(1,6)),
                                                    np.sinh(2*eta1*np.arange(1,6)))))) # [m]
	dist=(x**2+y**2)**0.5
	r = random.random()*(dist)
	angle = random.random()* 2 *math.pi
	new_lon =  r * math.cos(angle)
	new_lat =  r * math.sin(angle)
    # 補助関数

	def beta_array(n):
		b0 = np.nan # dummy
		b1 = (1./2)*n - (2./3)*(n**2) + (37./96)*(n**3) - (1./360)*(n**4) - (81./512)*(n**5)
		b2 = (1./48)*(n**2) + (1./15)*(n**3) - (437./1440)*(n**4) + (46./105)*(n**5)
		b3 = (17./480)*(n**3) - (37./840)*(n**4) - (209./4480)*(n**5)
		b4 = (4397./161280)*(n**4) - (11./504)*(n**5)
		b5 = (4583./161280)*(n**5)
		return np.array([b0, b1, b2, b3, b4, b5])

	def delta_array(n):
		d0 = np.nan # dummy
		d1 = 2.*n - (2./3)*(n**2) - 2.*(n**3) + (116./45)*(n**4) + (26./45)*(n**5) - (2854./675)*(n**6)
		d2 = (7./3)*(n**2) - (8./5)*(n**3) - (227./45)*(n**4) + (2704./315)*(n**5) + (2323./945)*(n**6)
		d3 = (56./15)*(n**3) - (136./35)*(n**4) - (1262./105)*(n**5) + (73814./2835)*(n**6)
		d4 = (4279./630)*(n**4) - (332./35)*(n**5) - (399572./14175)*(n**6)
		d5 = (4174./315)*(n**5) - (144838./6237)*(n**6)
		d6 = (601676./22275)*(n**6)
		return np.array([d0, d1, d2, d3, d4, d5, d6])


    # (1) beta_i, delta_iの計算
	beta_array = beta_array(n)
	delta_array = delta_array(n)

    # (2), S, Aの計算
	A_ = ( (m0*a)/(1.+n) )*A_array[0]
	S_ = ( (m0*a)/(1.+n) )*( A_array[0]*cen_lat_rad + np.dot(A_array[1:], np.sin(2*cen_lat_rad*np.arange(1,6))) )

    # (3) xi, etaの計算
	xi = (new_lat + S_) / A_
	eta = new_lon / A_

    # (4) xi', eta'の計算
	xi2 = xi - np.sum(np.multiply(beta_array[1:], 
                                  np.multiply(np.sin(2*xi*np.arange(1,6)),
                                              np.cosh(2*eta*np.arange(1,6)))))
	eta2 = eta - np.sum(np.multiply(beta_array[1:],
                                   np.multiply(np.cos(2*xi*np.arange(1,6)),
                                               np.sinh(2*eta*np.arange(1,6)))))

    # (5) chiの計算
	chi = np.arcsin( np.sin(xi2)/np.cosh(eta2) ) # [rad]
	new_lat_rad = chi + np.dot(delta_array[1:], np.sin(2*chi*np.arange(1, 7))) # [rad]

    # (6) 緯度(latitude), 経度(longitude)の計算
	new_lon_rad = cen_lon_rad + np.arctan( np.sinh(eta2)/np.cos(xi2) ) # [rad]

	rel_lat=np.rad2deg(new_lat_rad)
	rel_lon=np.rad2deg(new_lon_rad)

	sites=[]
	types = types.split(",")

	for type in types:
		url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={cen_lat}%2C{cen_lon}&radius={int(dist)}&type={type}&key=AIzaSyBABWHWDIR8FwQKbWYcdJyX--DyVFC_6L4&language=ja"
		payload={}
		headers = {}
		response = requests.request("GET", url, headers=headers, data=payload)
		d = response.json()
		sites+=d["results"]
	if len(sites)!=0:
		place= random.choice(sites)
		rel_place=place["name"]
		print("test1")
		print(place)
		rel_lat=place["geometry"]["location"]["lat"]
		rel_lon=place["geometry"]["location"]["lng"]


    # ラジアンを度になおしてreturn
	return {"rel_lat":rel_lat, "rel_lon":rel_lon,"rel_place":rel_place} # [deg]
	

app.mount("/", StaticFiles(directory="static", html=True), name="static")