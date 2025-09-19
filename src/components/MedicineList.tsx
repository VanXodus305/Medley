"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faPills,
  faSyringe,
  faCapsules,
  faTint,
  faSprayCan,
  faMortarPestle,
  faEyeDropper,
} from "@fortawesome/free-solid-svg-icons";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { useState, useEffect } from "react";
import { Select, SelectItem } from "@heroui/react";

// Import the complete medicines dataset
import medicinesData from "../data/medicines.json";

interface Medicine {
  id: string;
  name: string;
  uses: string[];
  brand: string;
  form: string;
}

const MedicineList: React.FC = () => {
  const [selectedForm, setSelectedForm] = useState<string>("All");
  const [filteredMedicines, setFilteredMedicines] =
    useState<Medicine[]>(medicinesData);

  // Get unique forms from the medicines data
  const medicinalForms = [
    "All",
    ...Array.from(new Set(medicinesData.map((med) => med.form))),
  ];

  // Filter medicines based on selected form
  useEffect(() => {
    if (selectedForm === "All") {
      setFilteredMedicines(medicinesData);
    } else {
      setFilteredMedicines(
        medicinesData.filter((med) => med.form === selectedForm)
      );
    }
  }, [selectedForm]);

  const sliderSettings = {
    dots: false,
    infinite: filteredMedicines.length > 3,
    speed: 500,
    slidesToShow: Math.min(filteredMedicines.length, 3),
    slidesToScroll: 1,
    autoplay: filteredMedicines.length > 3,
    autoplaySpeed: 1300,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(filteredMedicines.length, 2),
          infinite: filteredMedicines.length > 2,
          autoplay: filteredMedicines.length > 2,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          infinite: filteredMedicines.length > 1,
          autoplay: filteredMedicines.length > 1,
        },
      },
    ],
  };

  const getIconByForm = (form: string): IconProp => {
    switch (form) {
      case "Tablet":
        return faPills;
      case "Capsule":
        return faCapsules;
      case "Syrup":
      case "Suspension":
        return faTint;
      case "Eye Drops":
      case "Drops":
        return faEyeDropper;
      case "Injection":
        return faSyringe;
      case "Inhaler":
        return faSprayCan;
      case "Nasal Spray":
        return faSprayCan;
      case "Cream":
      case "Ointment":
        return faMortarPestle;
      case "Powder":
        return faMortarPestle;
      default:
        return faPills;
    }
  };

  return (
    <div className="w-full px-6 py-12 font-poppins bg-gradient-to-r from-[#f8faf9] to-[#f1fdf8] pb-16">
      <div className="flex items-center justify-center gap-10 mb-10 max-w-4xl mx-auto w-full sm:flex-row flex-col">
        <h2 className="text-3xl font-bold text-[#1F2A37]">Popular Medicines</h2>

        {/* Form Filter Dropdown */}
        <div className="flex items-center gap-3 sm:w-[50%] w-[80%]">
          <label className="text-sm font font-medium text-[#3C7168]">
            Filter by:
          </label>
          <Select
            selectedKeys={[selectedForm]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setSelectedForm(selected);
            }}
            size="md"
            className="max-w-xs"
            classNames={{
              trigger:
                "bg-white border-[#4FAA84] hover:border-[#3C7168] focus:border-[#4FAA84]",
              value: "text-[#3C7168] font-medium",
              selectorIcon: "text-[#4FAA84]",
            }}
            variant="bordered"
            aria-label="Filter medicines by form"
          >
            {medicinalForms.map((form) => (
              <SelectItem key={form} className="text-[#3C7168]">
                {form}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {filteredMedicines.length > 0 ? (
        <Slider {...sliderSettings}>
          {filteredMedicines.map((med: Medicine) => (
            <div key={med.id} className="p-4">
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-28 h-28 flex items-center justify-center text-[#4FAA84] text-6xl mb-4 hover:scale-105 transition-transform duration-300">
                    <FontAwesomeIcon icon={getIconByForm(med.form)} />
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
                  {med.uses.map((use: string, idx: number) => (
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
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl text-[#4FAA84] mb-4">
            <FontAwesomeIcon icon={faPills} />
          </div>
          <h3 className="text-xl font-semibold text-[#3C7168] mb-2">
            No medicines found
          </h3>
          <p className="text-gray-600">
            No medicines available for the selected form. Try selecting a
            different filter.
          </p>
        </div>
      )}
    </div>
  );
};

export default MedicineList;
