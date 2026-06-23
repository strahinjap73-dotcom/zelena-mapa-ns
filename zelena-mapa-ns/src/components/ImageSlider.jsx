import { useState } from "react";

function ImageSlider({ images, loading }) {
  const [index, setIndex] = useState(0);

  if (loading) {
    return (
      <div className="popup-slider popup-slider-empty">
        <p>Ucitavanje slika...</p>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="popup-slider popup-slider-empty">
        <p className="popup-no-images">Nema slika za ovu lokaciju</p>
      </div>
    );
  }

  const goPrev = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goNext = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const safeIndex = index < images.length ? index : 0;

  return (
    <div className="popup-slider">
      <div className="popup-slider-image-wrap">
        <img
          src={images[safeIndex].imageUrl}
          alt="location"
          className="popup-slider-image"
          loading="lazy"
        />
        {images.length > 1 && (
          <>
            <button
              className="popup-slider-btn popup-slider-btn-prev"
              onClick={goPrev}
              aria-label="Prethodna slika"
            >
              ‹
            </button>
            <button
              className="popup-slider-btn popup-slider-btn-next"
              onClick={goNext}
              aria-label="Sledeca slika"
            >
              ›
            </button>
            <div className="popup-slider-dots">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`popup-slider-dot ${i === safeIndex ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(i);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ImageSlider;
