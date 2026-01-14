const HeroSection = () => {
  return (
    <div className="w-full flex justify-center mt-2 px-2 md:px-0 md:mt-2">
      {/* ✅ Mobile Banner (below md) */}
      <a href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp">
        <img
          src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/pandit%20ji%20at%20reuest%20bannner%20size%20(1).jpg"
          alt="Pandit ji at request banner mobile"
          className="block md:hidden w-full max-w-7xl  rounded-lg object-cover"
        />

        {/* ✅ Desktop Banner (md and above) */}
        <img
          src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/1300415%20banner%20111111.jpg"
          alt="Pandit ji at request banner"
          className="hidden md:block w-full max-w-7xl rounded-lg object-cover"
        />
      </a>
    </div>
  );
};

export default HeroSection;
