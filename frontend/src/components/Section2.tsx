
export default function RegistrationSection() {
  return (
    <div className=" bg-gradient-to-br from-orange-50 via-white to-orange-50 p-8 ">
      <div className="max-w-6xl mx-auto ">
        {/* Header */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Desktop Registration */}
          <div className="relative">
            <div className="mb-6 md:mb-20 ml-0 md:ml-20">
              <h1 className="text-2xl md:text-5xl  mb-4">
                <span className="text-orange-500">Registration,</span>
              </h1>
              <p className="relative text-xl md:text-2xl text-gray-700 ml-3 md:ml-20">
                Join as Pandit Ji through{" "}
                <span className="relative inline-block">
                  <span className="font-semibold">Link Below</span>
                  <div className="hidden md:block absolute top-[-14px] left-[-10px]">
                    <svg
                      width="144"
                      height="66"
                      viewBox="0 0 194 66"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M118.152 5.66117C115.572 5.37624 112.993 5.09131 103.839 4.87155C94.6852 4.65179 79.0354 4.50584 66.4601 5.28873C53.8847 6.07163 44.858 7.78778 36.5381 10.0753C28.2181 12.3629 20.8785 15.1698 15.3996 18.3501C9.92065 21.5305 6.52483 24.9991 4.15604 27.8481C1.78724 30.6971 0.54838 32.8213 1.15161 36.3138C1.75484 39.8062 4.2377 44.6026 13.9384 49.9256C23.6392 55.2486 40.4826 60.9529 61.783 63.2509C83.0834 65.5489 108.331 64.2679 126.209 62.2243C144.088 60.1807 153.833 57.4134 162.449 53.4455C171.064 49.4777 178.253 44.3931 183.134 40.2081C188.015 36.023 190.369 32.8915 191.768 30.5074C193.166 28.1234 193.537 26.5816 191.272 23.4811C189.006 20.3806 184.093 15.768 177.779 12.1825C171.465 8.59713 163.899 6.17868 156.938 4.4814C143.963 1.31742 134.935 0.889526 129.96 1.02174C125.531 1.66647 118.948 4.35135 111.206 8.39859C107.928 10.2256 105.969 11.592 103.951 12.9997"
                        stroke="#FF0000"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  </div>
                  <div className="hidden md:block absolute top-[30px] right-[40px] z-10">
                    <svg
                      width="164"
                      height="120"
                      viewBox="0 0 164 201"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M161.229 0.0390625L160.454 48.7895C159.826 88.2906 133.625 122.81 95.7479 134.039L54.5418 144.572C45.8142 146.803 37.7409 151.074 30.9861 157.034L28.2371 159.46C17.7417 168.72 11.7295 182.042 11.7295 196.039"
                        stroke="black"
                        stroke-width="5"
                      />
                      <path
                        d="M1.72949 182.039L10.7295 197.539L24.2295 186.039"
                        stroke="black"
                        stroke-width="4"
                      />
                    </svg>
                  </div>
                </span>
              </p>
            </div>
            <div className="">
              <div className=" relative w-[300px] md:w-[400px]">
                <img
                  src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Image2.webp"
                  alt="Pandit registering on laptop"
                  className="w-full h-48 md:h-64 "
                />
                <div className="flex justify-center">
                  <button className=" absolute top-4 right-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-md px-6 py-2 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300">
                    JOIN
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Mobile View */}
          <div className="hidden  relative md:flex justify-center lg:justify-end">
            <div className="relative">
              <img
                src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/PnditImage.webp"
                alt="Pandit with mobile phone"
                className="w-[400px] h-[400px] object-cover "
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
