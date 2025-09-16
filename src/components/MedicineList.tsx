"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPills } from "@fortawesome/free-solid-svg-icons";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";

interface Medicine {
  id: string;
  name: string;
  uses: string[];
  brand: string;
  form: string;
  image: string;
}

const medicines: Medicine[] = [
  {
    id: "MED001",
    name: "Paracetamol",
    uses: ["Fever", "Headache", "Body Pain"],
    brand: "Crocin",
    form: "Tablet",
    image: "/images/med1.jpg",
  },
  {
    id: "MED002",
    name: "Ibuprofen",
    uses: ["Fever", "Pain", "Inflammation"],
    brand: "Brufen",
    form: "Tablet",
    image: "/images/med2.jpg",
  },
  {
    id: "MED003",
    name: "Cetirizine",
    uses: ["Allergy", "Cold", "Sneezing"],
    brand: "Cetzine",
    form: "Tablet",
    image: "/images/med3.jpg",
  },
  {
    id: "MED004",
    name: "Amoxicillin",
    uses: ["Infection", "Sore Throat"],
    brand: "Amoxil",
    form: "Capsule",
    image: "/images/med4.jpg",
  },
  {
    id: "MED005",
    name: "Azithromycin",
    uses: ["Infection", "Fever"],
    brand: "Zithromax",
    form: "Tablet",
    image: "/images/med5.jpg",
  },
  {
    id: "MED006",
    name: "Dolo 650",
    uses: ["Fever", "Pain"],
    brand: "Micro Labs",
    form: "Tablet",
    image: "/images/med6.jpg",
  },
  {
    id: "MED007",
    name: "Aspirin",
    uses: ["Pain", "Fever", "Inflammation"],
    brand: "Disprin",
    form: "Tablet",
    image: "/images/med7.jpg",
  },
  {
    id: "MED008",
    name: "Loratadine",
    uses: ["Allergy", "Cold"],
    brand: "Claritin",
    form: "Tablet",
    image: "/images/med8.jpg",
  },
  {
    id: "MED009",
    name: "Ranitidine",
    uses: ["Acidity", "Stomach Ache"],
    brand: "Zantac",
    form: "Tablet",
    image: "/images/med9.jpg",
  },
  {
    id: "MED010",
    name: "Domperidone",
    uses: ["Nausea", "Vomiting"],
    brand: "Motilium",
    form: "Tablet",
    image: "/images/med10.jpg",
  },
];

const MedicineList: React.FC = () => {
  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <div className="w-full px-6 py-12 font-poppins bg-gradient-to-r from-[#f8faf9] to-[#f1fdf8]">
      <h2 className="text-3xl font-bold mb-10 text-center text-[#1F2A37]">
        Popular Medicines
      </h2>

      <Slider {...sliderSettings}>
        {medicines.map((med) => (
          <div key={med.id} className="p-4">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-28 h-28 flex items-center justify-center text-[#4FAA84] text-6xl mb-4 hover:scale-105 transition-transform duration-300">
                  <FontAwesomeIcon icon={faPills} />
                </div>

                <span className="absolute -top-2 -right-2 bg-[#4FAA84] text-white text-[10px] px-2 py-0.5 rounded-full shadow">
                  {med.form}
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#3C7168] mb-1">
                {med.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">Brand: {med.brand}</p>

              <div className="flex flex-wrap gap-1 justify-center mb-3">
                {med.uses.map((use, idx) => (
                  <span
                    key={idx}
                    className="bg-[#4FAA84]/10 text-[#3C7168] text-[11px] px-2 py-0.5 rounded-full"
                  >
                    {use}
                  </span>
                ))}
              </div>

              <button className="mt-auto w-full py-2 bg-[#4FAA84] text-white rounded-lg text-sm font-medium hover:bg-[#3C7168] transition-colors shadow-sm">
                View Details
              </button>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default MedicineList;
