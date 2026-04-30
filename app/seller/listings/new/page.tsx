// app/seller/listings/new/page.tsx
"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/app/lib/supabase/client"
import { getZipCoordinates, normalizeZip } from "@/app/lib/zipCoordinates"
import styles from "../../seller.module.css"

type ListingKind = "item" | "bundle"
type FulfillmentType = "pickup" | "shipping" | "pickup_or_shipping"
type SaveMode = "draft" | "published"

type Category = {
  id: string
  name: string
  slug: string
}

type PhotoPreview = {
  id: string
  file: File
  url: string
}

const eventTypes = [
  { label: "Wedding", value: "wedding" },
  { label: "Quinceañera", value: "quinceanera" },
  { label: "Baby shower", value: "baby_shower" },
  { label: "Graduation", value: "graduation" },
  { label: "Corporate", value: "corporate" },
  { label: "Birthday", value: "birthday" },
  { label: "Engagement", value: "engagement_party" },
  { label: "Bridal shower", value: "bridal_shower" },
  { label: "Holiday", value: "holiday" },
  { label: "Other", value: "other" },
]

const conditions = [
  { label: "New", value: "new" },
  { label: "Like new", value: "like_new" },
  { label: "Used once", value: "used_once" },
  { label: "Good", value: "good" },
  { label: "Fair", value: "fair" },
]

function PhotoIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect
        x="14"
        y="17"
        width="36"
        height="30"
        rx="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle cx="24" cy="27" r="3" fill="currentColor" />
      <path
        d="M19 41l9-9 6 6 5-5 6 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function NewListingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [userId, setUserId] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState("")
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(null)

  const [listingKind, setListingKind] = useState<ListingKind>("item")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [eventType, setEventType] = useState("wedding")
  const [condition, setCondition] = useState("used_once")
  const [quantity, setQuantity] = useState("1")
  const [primaryColor, setPrimaryColor] = useState("")
  const [secondaryColor, setSecondaryColor] = useState("")
  const [styleValue, setStyleValue] = useState("")
  const [price, setPrice] = useState("")
  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType>("pickup")
  const [shippingPrice, setShippingPrice] = useState("")
  const [pickupZip, setPickupZip] = useState("")
  const [pickupCity, setPickupCity] = useState("")
  const [pickupState, setPickupState] = useState("")
  const [bundleGuestCount, setBundleGuestCount] = useState("")
  const [bundleIncludes, setBundleIncludes] = useState("")

  useEffect(() => {
    let mounted = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        router.replace("/login?next=/seller/listings/new")
        return
      }

      setUserId(user.id)

      await supabase
        .from("profiles")
        .update({
          can_sell: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      const { data: categoryRows } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })

      if (!mounted) return

      setCategories((categoryRows || []) as Category[])
      setLoading(false)
    }

    load()

    return () => {
      mounted = false
      photos.forEach((photo) => URL.revokeObjectURL(photo.url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase])

  const isPickup =
    fulfillmentType === "pickup" || fulfillmentType === "pickup_or_shipping"

  const isShipping =
    fulfillmentType === "shipping" || fulfillmentType === "pickup_or_shipping"

  const publishReady =
    photos.length > 0 &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    categoryId.length > 0 &&
    Number(price) > 0 &&
    Number(quantity) > 0 &&
    primaryColor.trim().length > 0 &&
    styleValue.trim().length > 0 &&
    (!isPickup ||
      (pickupZip.trim().length > 0 &&
        pickupCity.trim().length > 0 &&
        pickupState.trim().length > 0)) &&
    (!isShipping ||
      (shippingPrice.trim().length > 0 && Number(shippingPrice) >= 0)) &&
    (listingKind === "item" ||
      (Number(bundleGuestCount) > 0 && bundleIncludes.trim().length > 0))

  function handlePhotoChange(files: FileList | null) {
    if (!files) return

    const incoming = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, Math.max(0, 10 - photos.length))
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        url: URL.createObjectURL(file),
      }))

    setPhotos((current) => [...current, ...incoming])
  }

  function removePhoto(photoId: string) {
    setPhotos((current) => {
      const photo = current.find((item) => item.id === photoId)

      if (photo) {
        URL.revokeObjectURL(photo.url)

        if (previewPhotoUrl === photo.url) {
          setPreviewPhotoUrl("")
          setPreviewPhotoIndex(null)
        }
      }

      return current.filter((item) => item.id !== photoId)
    })
  }

  function openPhotoPreview(photoUrl: string, index: number) {
    setPreviewPhotoUrl(photoUrl)
    setPreviewPhotoIndex(index)
  }

  function closePhotoPreview() {
    setPreviewPhotoUrl("")
    setPreviewPhotoIndex(null)
  }

  async function uploadListingImages(listingId: string) {
    const uploadedImages = []

    for (let index = 0; index < photos.length; index += 1) {
      const photo = photos[index]
      const extension = photo.file.name.split(".").pop() || "jpg"
      const safeName = `photo-${index + 1}-${Date.now()}.${extension}`
      const storagePath = `${userId}/${listingId}/${safeName}`

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(storagePath, photo.file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data } = supabase.storage
        .from("listing-images")
        .getPublicUrl(storagePath)

      uploadedImages.push({
        listing_id: listingId,
        image_url: data.publicUrl,
        storage_path: storagePath,
        sort_order: index,
        is_primary: index === 0,
      })
    }

    if (uploadedImages.length > 0) {
      const { error: imageInsertError } = await supabase
        .from("listing_images")
        .insert(uploadedImages)

      if (imageInsertError) {
        throw new Error(imageInsertError.message)
      }
    }
  }

  async function saveListing(mode: SaveMode) {
    if (!userId || saving) return
    if (mode === "published" && !publishReady) return

    setSaving(true)
    setError("")

    try {
      const listingTitle = title.trim() || "Untitled listing"
      const cleanPickupZip = isPickup ? normalizeZip(pickupZip) : ""
      const pickupCoordinates = cleanPickupZip
        ? getZipCoordinates(cleanPickupZip)
        : null

      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert({
          seller_id: userId,
          category_id: categoryId || null,
          title: listingTitle,
          description: description.trim() || null,
          price: Number(price || 0),
          condition,
          quantity: Number(quantity || 1),
          event_type: eventType,
          style: styleValue.trim() || null,
          primary_color: primaryColor.trim() || null,
          secondary_color: secondaryColor.trim() || null,
          fulfillment_type: fulfillmentType,
          shipping_price: isShipping ? Number(shippingPrice || 0) : null,
          pickup_zip: isPickup ? cleanPickupZip || null : null,
          pickup_lat: isPickup ? pickupCoordinates?.lat ?? null : null,
          pickup_lng: isPickup ? pickupCoordinates?.lng ?? null : null,
          pickup_city: isPickup ? pickupCity.trim() || null : null,
          pickup_state: isPickup ? pickupState.trim() || null : null,
          is_bundle: listingKind === "bundle",
          bundle_guest_count:
            listingKind === "bundle" && bundleGuestCount
              ? Number(bundleGuestCount)
              : null,
          bundle_includes:
            listingKind === "bundle" ? bundleIncludes.trim() || null : null,
          status: mode,
          published_at: mode === "published" ? new Date().toISOString() : null,
        })
        .select("id")
        .single()

      if (listingError) {
        throw new Error(listingError.message)
      }

      if (!listing?.id) {
        throw new Error("Listing was not created.")
      }

      await uploadListingImages(listing.id)

      router.push("/seller")
      router.refresh()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save listing."
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await saveListing("published")
  }

  if (loading) {
    return (
      <main className={styles.sellerPage}>
        <section className={styles.loadingCard}>Loading...</section>
      </main>
    )
  }

  return (
    <main className={styles.sellerPage}>
      <header className={styles.sellerTopbar}>
        <Link href="/seller" className={styles.sellerBrand}>
          <span>D</span>
          <strong>Decor Encore</strong>
        </Link>

        <Link href="/seller" className={styles.sellerProfile}>
          Done
        </Link>
      </header>

      <section className={styles.createHero}>
        <p>Sell decor</p>
        <h1>List something beautiful.</h1>
      </section>

      <form className={styles.createForm} onSubmit={handleSubmit}>
        <section className={styles.photoSection}>
          <div
            className={`${styles.photoGrid} ${
              photos.length === 0 ? styles.photoGridEmpty : ""
            }`}
          >
            <label className={styles.addPhotoBox} aria-label="Add listing photos">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  handlePhotoChange(event.target.files)
                  event.target.value = ""
                }}
              />
              <PhotoIcon />
            </label>

            {photos.map((photo, index) => (
              <div key={photo.id} className={styles.photoPreview}>
                <button
                  type="button"
                  className={styles.photoPreviewOpen}
                  onClick={() => openPhotoPreview(photo.url, index)}
                  aria-label={`Preview photo ${index + 1}`}
                >
                  <img src={photo.url} alt={`Listing preview ${index + 1}`} />
                </button>

                <button
                  type="button"
                  className={styles.photoRemoveButton}
                  onClick={() => removePhoto(photo.id)}
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.formPanel}>
          <div className={styles.kindSwitch} role="tablist" aria-label="Listing type">
            <button
              type="button"
              className={listingKind === "item" ? styles.switchActive : ""}
              onClick={() => setListingKind("item")}
              role="tab"
              aria-selected={listingKind === "item"}
            >
              Item
            </button>

            <button
              type="button"
              className={listingKind === "bundle" ? styles.switchActive : ""}
              onClick={() => setListingKind("bundle")}
              role="tab"
              aria-selected={listingKind === "bundle"}
            >
              Bundle
            </button>

            <span
              className={`${styles.kindSlider} ${
                listingKind === "bundle" ? styles.sliderRight : styles.sliderLeft
              }`}
            />
          </div>

          <label className={styles.sellerField}>
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Gold charger plates, flower wall, full decor bundle..."
              required
            />
          </label>

          <label className={styles.sellerField}>
            <span>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Condition, what is included, measurements, pickup notes..."
              rows={5}
              required
            />
          </label>

          <div className={styles.twoColumn}>
            <label className={styles.sellerField}>
              <span>Category</span>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                required
              >
                <option value="">Select</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.sellerField}>
              <span>Event</span>
              <select
                value={eventType}
                onChange={(event) => setEventType(event.target.value)}
              >
                {eventTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.twoColumn}>
            <label className={styles.sellerField}>
              <span>Condition</span>
              <select
                value={condition}
                onChange={(event) => setCondition(event.target.value)}
              >
                {conditions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.sellerField}>
              <span>Quantity</span>
              <input
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                type="number"
                min="1"
                inputMode="numeric"
                required
              />
            </label>
          </div>

          <div className={styles.twoColumn}>
            <label className={styles.sellerField}>
              <span>Color</span>
              <input
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                placeholder="Blush, gold, sage..."
                required
              />
            </label>

            <label className={styles.sellerField}>
              <span>Accent</span>
              <input
                value={secondaryColor}
                onChange={(event) => setSecondaryColor(event.target.value)}
                placeholder="Optional"
              />
            </label>
          </div>

          <div className={styles.twoColumn}>
            <label className={styles.sellerField}>
              <span>Style</span>
              <input
                value={styleValue}
                onChange={(event) => setStyleValue(event.target.value)}
                placeholder="Modern, glam, vintage..."
                required
              />
            </label>

            <label className={styles.sellerField}>
              <span>Price</span>
              <input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                required
              />
            </label>
          </div>

          {listingKind === "bundle" ? (
            <>
              <label className={styles.sellerField}>
                <span>Guest count</span>
                <input
                  value={bundleGuestCount}
                  onChange={(event) => setBundleGuestCount(event.target.value)}
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="100"
                  required
                />
              </label>

              <label className={styles.sellerField}>
                <span>Bundle includes</span>
                <textarea
                  value={bundleIncludes}
                  onChange={(event) => setBundleIncludes(event.target.value)}
                  placeholder="100 charger plates, 12 centerpieces, welcome sign, card box..."
                  rows={4}
                  required
                />
              </label>
            </>
          ) : null}
        </section>

        <section className={styles.formPanel}>
          <div
            className={styles.fulfillmentSwitch}
            role="tablist"
            aria-label="Fulfillment type"
          >
            <button
              type="button"
              className={fulfillmentType === "pickup" ? styles.switchActive : ""}
              onClick={() => setFulfillmentType("pickup")}
              role="tab"
              aria-selected={fulfillmentType === "pickup"}
            >
              Pickup
            </button>

            <button
              type="button"
              className={fulfillmentType === "shipping" ? styles.switchActive : ""}
              onClick={() => setFulfillmentType("shipping")}
              role="tab"
              aria-selected={fulfillmentType === "shipping"}
            >
              Shipping
            </button>

            <button
              type="button"
              className={
                fulfillmentType === "pickup_or_shipping" ? styles.switchActive : ""
              }
              onClick={() => setFulfillmentType("pickup_or_shipping")}
              role="tab"
              aria-selected={fulfillmentType === "pickup_or_shipping"}
            >
              Both
            </button>

            <span
              className={`${styles.fulfillmentSlider} ${
                fulfillmentType === "pickup"
                  ? styles.fulfillmentOne
                  : fulfillmentType === "shipping"
                    ? styles.fulfillmentTwo
                    : styles.fulfillmentThree
              }`}
            />
          </div>

          {isPickup ? (
            <>
              <div className={styles.twoColumn}>
                <label className={styles.sellerField}>
                  <span>City</span>
                  <input
                    value={pickupCity}
                    onChange={(event) => setPickupCity(event.target.value)}
                    placeholder="Tampa"
                    required={isPickup}
                  />
                </label>

                <label className={styles.sellerField}>
                  <span>State</span>
                  <input
                    value={pickupState}
                    onChange={(event) =>
                      setPickupState(event.target.value.toUpperCase().slice(0, 2))
                    }
                    placeholder="FL"
                    maxLength={2}
                    required={isPickup}
                  />
                </label>
              </div>

              <label className={styles.sellerField}>
                <span>ZIP</span>
                <input
                  value={pickupZip}
                  onChange={(event) => setPickupZip(event.target.value)}
                  placeholder="33602"
                  inputMode="numeric"
                  maxLength={10}
                  required={isPickup}
                />
              </label>
            </>
          ) : null}

          {isShipping ? (
            <label className={`${styles.sellerField} ${styles.shippingField}`}>
              <span>Shipping price</span>
              <input
                value={shippingPrice}
                onChange={(event) => setShippingPrice(event.target.value)}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                required={isShipping}
              />
            </label>
          ) : null}
        </section>

        {error ? <p className={styles.sellerError}>{error}</p> : null}

        <section className={styles.publishBar}>
          <button
            type="button"
            className={styles.draftButton}
            onClick={() => saveListing("draft")}
            disabled={saving}
          >
            Draft
          </button>

          <button
            type="submit"
            className={styles.publishButton}
            disabled={saving || !publishReady}
          >
            {saving ? "Saving..." : "Publish"}
          </button>
        </section>
      </form>

      {previewPhotoUrl ? (
        <div
          className={styles.photoModalBackdrop}
          onClick={closePhotoPreview}
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
        >
          <div
            className={styles.photoModal}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.photoModalClose}
              onClick={closePhotoPreview}
              aria-label="Close photo preview"
            >
              ×
            </button>

            <div className={styles.photoModalFrame}>
              <img
                src={previewPhotoUrl}
                alt={
                  previewPhotoIndex !== null
                    ? `Listing preview ${previewPhotoIndex + 1}`
                    : "Listing preview"
                }
                className={styles.photoModalImage}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}