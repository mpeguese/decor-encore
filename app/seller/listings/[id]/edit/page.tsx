"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/app/lib/supabase/client"
import styles from "../../../seller.module.css"

type ListingKind = "item" | "bundle"
type FulfillmentType = "pickup" | "shipping" | "pickup_or_shipping"
type ListingStatus = "draft" | "published" | "paused" | "sold" | "removed"

type Category = {
  id: string
  name: string
  slug: string
}

type ExistingImage = {
  id: string
  image_url: string
  storage_path: string | null
  sort_order: number
  is_primary: boolean
}

type NewPhoto = {
  id: string
  file: File
  url: string
}

type PrimaryTarget =
  | {
      kind: "existing"
      id: string
    }
  | {
      kind: "new"
      id: string
    }
  | null

type ListingRow = {
  id: string
  seller_id: string
  category_id: string | null
  title: string
  description: string | null
  price: number
  condition: string
  quantity: number
  event_type: string
  style: string | null
  primary_color: string | null
  secondary_color: string | null
  fulfillment_type: FulfillmentType
  shipping_price: number | null
  pickup_zip: string | null
  pickup_city: string | null
  pickup_state: string | null
  is_bundle: boolean
  bundle_guest_count: number | null
  bundle_includes: string | null
  status: ListingStatus
  listing_images: ExistingImage[]
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

function getFirstPrimaryTarget(
  existingImages: ExistingImage[],
  newPhotos: NewPhoto[]
): PrimaryTarget {
  const primaryExisting = existingImages.find((image) => image.is_primary)

  if (primaryExisting) {
    return {
      kind: "existing",
      id: primaryExisting.id,
    }
  }

  if (existingImages[0]) {
    return {
      kind: "existing",
      id: existingImages[0].id,
    }
  }

  if (newPhotos[0]) {
    return {
      kind: "new",
      id: newPhotos[0].id,
    }
  }

  return null
}

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = useMemo(() => createClient(), [])

  const listingId = Array.isArray(params.id) ? params.id[0] : params.id

  const [userId, setUserId] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [status, setStatus] = useState<ListingStatus>("draft")
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<ExistingImage[]>([])
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([])
  const [primaryTarget, setPrimaryTarget] = useState<PrimaryTarget>(null)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState("")
  const [previewLabel, setPreviewLabel] = useState("Listing preview")

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

    async function loadListing() {
      if (!listingId) return

      setLoading(true)
      setError("")
      setMessage("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        router.replace(`/login?next=/seller/listings/${listingId}/edit`)
        return
      }

      setUserId(user.id)

      const { data: categoryRows } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })

      if (mounted) {
        setCategories((categoryRows || []) as Category[])
      }

      const { data, error: listingError } = await supabase
        .from("listings")
        .select(
          `
          id,
          seller_id,
          category_id,
          title,
          description,
          price,
          condition,
          quantity,
          event_type,
          style,
          primary_color,
          secondary_color,
          fulfillment_type,
          shipping_price,
          pickup_zip,
          pickup_city,
          pickup_state,
          is_bundle,
          bundle_guest_count,
          bundle_includes,
          status,
          listing_images (
            id,
            image_url,
            storage_path,
            sort_order,
            is_primary
          )
        `
        )
        .eq("id", listingId)
        .eq("seller_id", user.id)
        .single()

      if (!mounted) return

      if (listingError || !data) {
        setError("Listing not found or you do not have access to edit it.")
        setLoading(false)
        return
      }

      const listing = data as unknown as ListingRow
      const sortedImages = [...(listing.listing_images || [])].sort(
        (a, b) => a.sort_order - b.sort_order
      )

      setStatus(listing.status)
      setExistingImages(sortedImages)
      setPrimaryTarget(getFirstPrimaryTarget(sortedImages, []))

      setListingKind(listing.is_bundle ? "bundle" : "item")
      setTitle(listing.title || "")
      setDescription(listing.description || "")
      setCategoryId(listing.category_id || "")
      setEventType(listing.event_type || "wedding")
      setCondition(listing.condition || "used_once")
      setQuantity(String(listing.quantity || 1))
      setPrimaryColor(listing.primary_color || "")
      setSecondaryColor(listing.secondary_color || "")
      setStyleValue(listing.style || "")
      setPrice(String(Number(listing.price || 0)))
      setFulfillmentType(listing.fulfillment_type || "pickup")
      setShippingPrice(
        listing.shipping_price !== null ? String(listing.shipping_price) : ""
      )
      setPickupZip(listing.pickup_zip || "")
      setPickupCity(listing.pickup_city || "")
      setPickupState(listing.pickup_state || "")
      setBundleGuestCount(
        listing.bundle_guest_count ? String(listing.bundle_guest_count) : ""
      )
      setBundleIncludes(listing.bundle_includes || "")

      setLoading(false)
    }

    loadListing()

    return () => {
      mounted = false
      newPhotos.forEach((photo) => URL.revokeObjectURL(photo.url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, router, supabase])

  const isPickup =
    fulfillmentType === "pickup" || fulfillmentType === "pickup_or_shipping"

  const isShipping =
    fulfillmentType === "shipping" || fulfillmentType === "pickup_or_shipping"

  const finalPhotoCount = existingImages.length + newPhotos.length

  const publishReady =
    finalPhotoCount > 0 &&
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

    const availableSlots = Math.max(0, 10 - finalPhotoCount)

    const incoming = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, availableSlots)
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        url: URL.createObjectURL(file),
      }))

    if (incoming.length === 0) return

    setNewPhotos((current) => {
      const next = [...current, ...incoming]

      if (!primaryTarget && existingImages.length === 0) {
        setPrimaryTarget({
          kind: "new",
          id: incoming[0].id,
        })
      }

      return next
    })
  }

  function removeExistingImage(imageId: string) {
    setExistingImages((current) => {
      const image = current.find((item) => item.id === imageId)
      const nextExisting = current.filter((item) => item.id !== imageId)

      if (image) {
        setImagesToDelete((currentDelete) => [...currentDelete, image])
      }

      if (primaryTarget?.kind === "existing" && primaryTarget.id === imageId) {
        setPrimaryTarget(getFirstPrimaryTarget(nextExisting, newPhotos))
      }

      return nextExisting
    })
  }

  function removeNewPhoto(photoId: string) {
    setNewPhotos((current) => {
      const photo = current.find((item) => item.id === photoId)
      const nextPhotos = current.filter((item) => item.id !== photoId)

      if (photo) {
        URL.revokeObjectURL(photo.url)

        if (previewPhotoUrl === photo.url) {
          setPreviewPhotoUrl("")
        }
      }

      if (primaryTarget?.kind === "new" && primaryTarget.id === photoId) {
        setPrimaryTarget(getFirstPrimaryTarget(existingImages, nextPhotos))
      }

      return nextPhotos
    })
  }

  function openPhotoPreview(photoUrl: string, label: string) {
    setPreviewPhotoUrl(photoUrl)
    setPreviewLabel(label)
  }

  function closePhotoPreview() {
    setPreviewPhotoUrl("")
    setPreviewLabel("Listing preview")
  }

  async function deleteRemovedImages() {
    if (imagesToDelete.length === 0) return

    const storagePaths = imagesToDelete
      .map((image) => image.storage_path)
      .filter(Boolean) as string[]

    if (storagePaths.length > 0) {
      await supabase.storage.from("listing-images").remove(storagePaths)
    }

    const imageIds = imagesToDelete.map((image) => image.id)

    const { error: deleteError } = await supabase
      .from("listing_images")
      .delete()
      .in("id", imageIds)

    if (deleteError) {
      throw new Error(deleteError.message)
    }
  }

  async function uploadNewImages() {
    const newIdMap: Record<string, string> = {}

    if (!listingId || !userId || newPhotos.length === 0) {
      return newIdMap
    }

    for (let index = 0; index < newPhotos.length; index += 1) {
      const photo = newPhotos[index]
      const extension = photo.file.name.split(".").pop() || "jpg"
      const safeName = `photo-${Date.now()}-${index + 1}.${extension}`
      const storagePath = `${userId}/${listingId}/${safeName}`
      const sortOrder = existingImages.length + index

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(storagePath, photo.file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data: publicUrlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(storagePath)

      const { data: insertedImage, error: insertImageError } = await supabase
        .from("listing_images")
        .insert({
          listing_id: listingId,
          image_url: publicUrlData.publicUrl,
          storage_path: storagePath,
          sort_order: sortOrder,
          is_primary: false,
        })
        .select("id")
        .single()

      if (insertImageError || !insertedImage?.id) {
        throw new Error(insertImageError?.message || "Unable to save image.")
      }

      newIdMap[photo.id] = insertedImage.id
    }

    return newIdMap
  }

  async function updateImageOrderAndPrimary(newIdMap: Record<string, string>) {
    if (!listingId) return

    for (let index = 0; index < existingImages.length; index += 1) {
      const image = existingImages[index]

      await supabase
        .from("listing_images")
        .update({
          sort_order: index,
        })
        .eq("id", image.id)
    }

    await supabase
      .from("listing_images")
      .update({
        is_primary: false,
      })
      .eq("listing_id", listingId)

    let primaryImageId = ""

    if (primaryTarget?.kind === "existing") {
      primaryImageId = primaryTarget.id
    }

    if (primaryTarget?.kind === "new") {
      primaryImageId = newIdMap[primaryTarget.id] || ""
    }

    if (!primaryImageId) {
      const fallbackExisting = existingImages[0]?.id
      const fallbackNew = Object.values(newIdMap)[0]
      primaryImageId = fallbackExisting || fallbackNew || ""
    }

    if (primaryImageId) {
      const { error: primaryError } = await supabase
        .from("listing_images")
        .update({
          is_primary: true,
        })
        .eq("id", primaryImageId)

      if (primaryError) {
        throw new Error(primaryError.message)
      }
    }
  }

  async function saveListing(nextStatus?: ListingStatus) {
    if (!listingId || !userId || saving) return

    const intendedStatus = nextStatus || status

    if (intendedStatus === "published" && !publishReady) {
      setError("Complete all required fields before publishing.")
      return
    }

    setSaving(true)
    setError("")
    setMessage("")

    try {
      const { error: updateError } = await supabase
        .from("listings")
        .update({
          category_id: categoryId || null,
          title: title.trim() || "Untitled listing",
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
          pickup_zip: isPickup ? pickupZip.trim() || null : null,
          pickup_city: isPickup ? pickupCity.trim() || null : null,
          pickup_state: isPickup ? pickupState.trim() || null : null,
          is_bundle: listingKind === "bundle",
          bundle_guest_count:
            listingKind === "bundle" && bundleGuestCount
              ? Number(bundleGuestCount)
              : null,
          bundle_includes:
            listingKind === "bundle" ? bundleIncludes.trim() || null : null,
          status: intendedStatus,
          published_at:
            intendedStatus === "published" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listingId)
        .eq("seller_id", userId)

      if (updateError) {
        throw new Error(updateError.message)
      }

      await deleteRemovedImages()
      const newIdMap = await uploadNewImages()
      await updateImageOrderAndPrimary(newIdMap)

      newPhotos.forEach((photo) => URL.revokeObjectURL(photo.url))
      setNewPhotos([])
      setImagesToDelete([])
      setStatus(intendedStatus)
      setMessage("Listing updated.")

      router.refresh()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update listing."
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await saveListing(status === "published" ? "published" : status)
  }

  if (loading) {
    return (
      <main className={styles.sellerPage}>
        <section className={styles.loadingCard}>Loading...</section>
      </main>
    )
  }

  if (error && !listingId) {
    return (
      <main className={styles.sellerPage}>
        <section className={styles.loadingCard}>{error}</section>
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
        <p>Edit listing</p>
        <h1>Keep it accurate.</h1>
      </section>

      <section className={`${styles.formPanel} ${styles.editStatusPanel}`}>
        <div className={styles.editStatusHeader}>
            <div>
            <span>Status</span>
            <strong>{status === "published" ? "Published" : status}</strong>
            </div>

            <div className={styles.editStatusSwitch}>
                <Link href="/seller" className={styles.editStatusSwitchOption}>
                    Listings
                </Link>

                {status === "published" ? (
                    <button
                    type="button"
                    className={styles.editStatusSwitchOption}
                    onClick={() => saveListing("paused")}
                    disabled={saving}
                    >
                    Pause
                    </button>
                ) : (
                    <button
                    type="button"
                    className={styles.editStatusSwitchOption}
                    onClick={() => saveListing("published")}
                    disabled={!publishReady || saving}
                    >
                    Publish
                    </button>
                )}

                <button
                    type="button"
                    className={`${styles.editStatusSwitchOption} ${styles.editStatusDanger}`}
                    onClick={() => saveListing("removed")}
                    disabled={saving}
                >
                    Remove
                </button>

                <span
                    className={`${styles.editStatusSwitchSlider} ${
                    status === "published"
                        ? styles.editStatusSliderMiddle
                        : status === "removed"
                        ? styles.editStatusSliderRight
                        : styles.editStatusSliderLeft
                    }`}
                />
            </div>
        </div>
        </section>

      <form className={styles.createForm} onSubmit={handleSubmit}>
        <section className={styles.photoSection}>
          <div
            className={`${styles.photoGrid} ${
              finalPhotoCount === 0 ? styles.photoGridEmpty : ""
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

            {existingImages.map((image, index) => {
              const isPrimary =
                primaryTarget?.kind === "existing" &&
                primaryTarget.id === image.id

              return (
                <div key={image.id} className={styles.photoPreview}>
                  <button
                    type="button"
                    className={styles.photoPreviewOpen}
                    onClick={() =>
                      openPhotoPreview(
                        image.image_url,
                        `Existing listing photo ${index + 1}`
                      )
                    }
                    aria-label={`Preview existing photo ${index + 1}`}
                  >
                    <img
                      src={image.image_url}
                      alt={`Existing listing preview ${index + 1}`}
                    />
                  </button>

                  <button
                    type="button"
                    className={styles.photoRemoveButton}
                    onClick={() => removeExistingImage(image.id)}
                    aria-label="Remove photo"
                  >
                    ×
                  </button>

                  <button
                    type="button"
                    className={`${styles.primaryPhotoButton} ${
                      isPrimary ? styles.primaryPhotoActive : ""
                    }`}
                    onClick={() =>
                      setPrimaryTarget({
                        kind: "existing",
                        id: image.id,
                      })
                    }
                  >
                    {isPrimary ? "Primary" : "Make primary"}
                  </button>
                </div>
              )
            })}

            {newPhotos.map((photo, index) => {
              const isPrimary =
                primaryTarget?.kind === "new" && primaryTarget.id === photo.id

              return (
                <div key={photo.id} className={styles.photoPreview}>
                  <button
                    type="button"
                    className={styles.photoPreviewOpen}
                    onClick={() =>
                      openPhotoPreview(photo.url, `New listing photo ${index + 1}`)
                    }
                    aria-label={`Preview new photo ${index + 1}`}
                  >
                    <img src={photo.url} alt={`New listing preview ${index + 1}`} />
                  </button>

                  <button
                    type="button"
                    className={styles.photoRemoveButton}
                    onClick={() => removeNewPhoto(photo.id)}
                    aria-label="Remove photo"
                  >
                    ×
                  </button>

                  <button
                    type="button"
                    className={`${styles.primaryPhotoButton} ${
                      isPrimary ? styles.primaryPhotoActive : ""
                    }`}
                    onClick={() =>
                      setPrimaryTarget({
                        kind: "new",
                        id: photo.id,
                      })
                    }
                  >
                    {isPrimary ? "Primary" : "Make primary"}
                  </button>
                </div>
              )
            })}
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
        {message ? <p className={styles.sellerSuccess}>{message}</p> : null}

        <section className={`${styles.publishBar} ${styles.editSaveBar}`}>
            <button
                type="submit"
                className={styles.publishButton}
                disabled={saving || (status === "published" && !publishReady)}
            >
                {saving ? "Saving..." : "Save changes"}
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
                alt={previewLabel}
                className={styles.photoModalImage}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}