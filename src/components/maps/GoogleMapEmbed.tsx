interface GoogleMapEmbedProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  width?: string;
  height?: string;
  className?: string;
}

const GoogleMapEmbed = ({
  latitude = 18.563072,
  longitude = 73.82958,
  zoom = 10,
  width = "100%",
  height = "450",
  className = "",
}: GoogleMapEmbedProps) => {
  const mapSrc = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d${Math.pow(2, 21 - zoom)}!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1766388579251!5m2!1sen!2sin`;

  return (
    <iframe
      src={mapSrc}
      width={width}
      height={height}
      style={{ border: 0 }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={`rounded-lg ${className}`}
      title="Location Map"
    />
  );
};

export default GoogleMapEmbed;
