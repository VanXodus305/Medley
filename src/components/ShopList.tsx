"use client";

import React from "react";
import { FaUser, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import { GiPill } from "react-icons/gi";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";

interface Medicine {
  medicine_id: string;
  quantity: number;
  price: number;
}

interface Shop {
  id: string;
  name: string;
  owner: string;
  phone: string;
  location: string;
  distance_from_user: string;
  medicines: Medicine[];
}

const shop: Shop[] = [
  {
    id: "SHOP001",
    name: "HealthPlus Pharmacy",
    owner: "Amit Sharma",
    phone: "+91-9876543210",
    location: "123 Main Street, City Center",
    distance_from_user: "50 metres",
    medicines: [],
  },
  {
    id: "SHOP002",
    name: "City Medicos",
    owner: "Priya Verma",
    phone: "+91-9123456780",
    location: "456 Market Road, Near Park",
    distance_from_user: "120 metres",
    medicines: [],
  },
  {
    id: "SHOP003",
    name: "Wellness Chemist",
    owner: "Rohit Singh",
    phone: "+91-9988776655",
    location: "789 Hospital Lane, Sector 5",
    distance_from_user: "200 metres",
    medicines: [],
  },
  {
    id: "SHOP004",
    name: "Family Pharmacy",
    owner: "Sunita Patel",
    phone: "+91-9871234567",
    location: "321 Suburb Road, Block A",
    distance_from_user: "350 metres",
    medicines: [],
  },
  {
    id: "SHOP005",
    name: "Neighborhood Meds",
    owner: "Vikas Kumar",
    phone: "+91-9001122334",
    location: "654 College Street, Near Library",
    distance_from_user: "500 metres",
    medicines: [],
  },
  {
    id: "SHOP006",
    name: "Apollo Pharmacy",
    owner: "Ramesh Gupta",
    phone: "+91-9812345678",
    location: "12 MG Road, Downtown",
    distance_from_user: "700 metres",
    medicines: [],
  },
  {
    id: "SHOP007",
    name: "Medico Mart",
    owner: "Sonal Mehta",
    phone: "+91-9876543201",
    location: "88 Green Avenue, Sector 9",
    distance_from_user: "1 km",
    medicines: [],
  },
  {
    id: "SHOP008",
    name: "Lifeline Chemists",
    owner: "Deepak Joshi",
    phone: "+91-9823456789",
    location: "22 Lake View, East End",
    distance_from_user: "1.2 km",
    medicines: [],
  },
  {
    id: "SHOP009",
    name: "Carewell Pharmacy",
    owner: "Anjali Rao",
    phone: "+91-9834567890",
    location: "5 Park Lane, West City",
    distance_from_user: "1.5 km",
    medicines: [],
  },
  {
    id: "SHOP010",
    name: "Good Health Store",
    owner: "Manoj Sinha",
    phone: "+91-9845678901",
    location: "77 Hill Road, North Block",
    distance_from_user: "1.8 km",
    medicines: [],
  },
];

const ShopList: React.FC = () => {
  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 1300,
    arrows: false,
    centerMode: true,
    centerPadding: "0px",
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2, centerPadding: "0px" } },
      { breakpoint: 640, settings: { slidesToShow: 1, centerPadding: "0px" } },
    ],
  };

  return (
    <div className="w-full px-6 py-12 font-poppins bg-gradient-to-r from-[#f8faf9] to-[#f1fdf8] sm:pb-28 pb-12">
      <h2 className="text-3xl font-bold mb-8 text-center text-[#1F2A37]">
        Nearby Medical Shops
      </h2>

      <Slider {...sliderSettings}>
        {shop.map((shop) => (
          <div key={shop.id} className="p-3 flex justify-center items-center">
            <div className="w-[270px] h-[300px] bg-white rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-[#4FAA84] to-[#3C7168] p-4 rounded-t-2xl">
                <h3 className="text-lg font-bold text-white">{shop.name}</h3>
              </div>

              {/* Card Body */}
              <div className="p-7 flex flex-col flex-1 font-sans">
                <p className="text-base font-semibold text-gray-800 tracking-wide mb-1 flex items-center gap-2">
                  <FaUser className="w-5 h-5 text-green-700" />
                  {shop.owner}
                </p>

                <p className="text-base font-medium text-gray-800 mb-1 flex items-center gap-2">
                  <FaPhone className="w-5 h-5 text-blue-700" />
                  {shop.phone}
                </p>

                <p className="text-sm italic text-gray-700 mb-3 leading-relaxed flex items-center gap-2">
                  <FaMapMarkerAlt className="w-4 h-4 text-red-600" />
                  {shop.location}
                </p>

                {/* Distance pill */}
                <div className="mt-auto mb-3 flex justify-center">
                  <div className="flex items-center gap-1 bg-white text-[#3C7168] border border-[#3C7168] px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
                    <GiPill size={16} />
                    <span>{shop.distance_from_user}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button className="py-2 px-3 rounded-lg text-sm font-medium bg-[#4FAA84] text-white hover:bg-[#3C7168] transition">
                  View Shop
                </button>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ShopList;
