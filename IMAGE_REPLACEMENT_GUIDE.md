# Image Replacement Guide

## ✅ Completed Changes

All `figma:asset/...` imports have been successfully replaced with local PNG files located in `src/assets/images/`.

### Files Updated:
1. ✅ `src/app/components/my-orders.tsx`
2. ✅ `src/app/components/order-form.tsx`
3. ✅ `src/app/components/verify-stock.tsx`
4. ✅ `src/app/components/stockist-home.tsx`

### Configuration Files Created:
- ✅ `tsconfig.json` - TypeScript configuration with path aliases
- ✅ `tsconfig.node.json` - Node TypeScript configuration
- ✅ `src/vite-env.d.ts` - Type declarations for image imports

## 📸 Your Images

You provided 4 jewelry images:
1. **Image 1** - Gold box chain necklace (single piece)
2. **Image 2** - Multiple gold box chains (close-up)
3. **Image 3** - Multiple gold rope chains
4. **Image 4** - Gold ring with diamonds

## 🎯 Next Steps: Replace Placeholder Images

### Current Placeholder Images (need to be replaced):

All 9 images in `src/assets/images/` are currently minimal placeholders:

1. `italy-santa.png` - Replace with box chain necklace photo
2. `italy-kaca.png` - Replace with glass-link style chain photo
3. `italy-bambu.png` - Replace with bamboo-link chain photo
4. `kalung-flexi.png` - Replace with flexible necklace photo
5. `sunny-vanessa.png` - Replace with Sunny/Vanessa style photo
6. `hollow-fancy-nori.png` - Replace with hollow fancy chain photo
7. `milano.png` - Replace with Milano chain photo
8. `tambang.png` - Replace with rope chain photo
9. `casteli.png` - Replace with Casteli chain photo

### How to Replace:

#### Option 1: Manual Replacement
1. Navigate to `src/assets/images/` folder
2. Take/prepare your jewelry photos
3. Save them with the **exact filenames** listed above
4. Recommended specs:
   - Format: PNG
   - Size: 200x200px to 400x400px
   - Background: White or transparent
   - Quality: High resolution

#### Option 2: Use Your Provided Images
Based on the images you shared, here's a suggested mapping:
- Use **Image 1** (box chain) for: `italy-santa.png`
- Use **Image 2** (multiple box chains) for: `italy-kaca.png`
- Use **Image 3** (rope chains) for: `tambang.png`
- Use **Image 4** (diamond ring) if you add ring images later

### For Rings and Additional Product Types:

The current implementation focuses on "Nama Basic" (basic necklaces/chains). If you need images for other product types like rings, you can:

1. Create a new folder: `src/assets/images/rings/`
2. Add ring images with descriptive names
3. Update the relevant components to include these images

## 🔧 Technical Details

### Import Structure:
```typescript
import italySanta from "@/assets/images/italy-santa.png";
import italyKaca from "@/assets/images/italy-kaca.png";
// ... etc
```

### Image Mapping:
```typescript
const NAMA_BASIC_IMAGES: Record<string, string> = {
  "italy-santa": italySanta,
  "italy-kaca": italyKaca,
  "italy-bambu": italyBambu,
  "kalung-flexi": kalungFlexi,
  "sunny-vanessa": sunnyVanessa,
  "hollow-fancy-nori": hollowFancyNori,
  milano: milano,
  tambang: tambang,
  casteli: casteli,
};
```

## ✨ Benefits of Local Images

- ✅ No dependency on external Figma assets
- ✅ Faster loading times
- ✅ Full control over image quality
- ✅ Easy to update and maintain
- ✅ Works offline

## 🚀 Testing

After replacing the images:
1. Run `pnpm dev` to start the development server
2. Navigate to pages that display jewelry images
3. Verify all images load correctly
4. Check that images match their respective product types

## 📝 Notes

- All images use the `@/assets/images/` path alias
- TypeScript declarations handle PNG imports automatically
- Images are bundled by Vite during build process
- The same image mapping is used across all 4 components for consistency
