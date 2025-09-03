import { Component, EventEmitter, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductsService } from '../../../services/products.service';
import { Product } from '../../../interface/product';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    FormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent {

  productForm: FormGroup;
  @Output() closed = new EventEmitter<void>();
  @Output() productAdded = new EventEmitter<void>();

  constructor(private fb: FormBuilder, private productsService: ProductsService) {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      subtitle: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
      final_price: [{ value: 0, disabled: true }],
      stock: [0, [Validators.min(0)]],
      description: [''],
      code: [''],
      category: ['t-shirts'],
      firstRate: [0, [Validators.min(0), Validators.max(5)]],
      colors: this.fb.array([])
    });

    // تحديث final_price تلقائي عند تغيير السعر أو الخصم
    this.productForm.get('price')?.valueChanges.subscribe(() => this.updateFinalPrice());
    this.productForm.get('discount')?.valueChanges.subscribe(() => this.updateFinalPrice());
  }

  // final price
  updateFinalPrice() {
    const price = this.productForm.get('price')?.value || 0;
    const discount = this.productForm.get('discount')?.value || 0;
    const finalPrice = price - discount;
    this.productForm.get('final_price')?.setValue(finalPrice > 0 ? finalPrice : 0);
  }

  // getters
  get colors(): FormArray {
    return this.productForm.get('colors') as FormArray;
  }

  // create a new color group
  newColor(): FormGroup {
    return this.fb.group({
      color_name: ['', Validators.required],
      color_code: ['#000000', Validators.required],
      sizes: this.fb.array([]) // array of sizes for this color
    });
  }

  addColor() {
    this.colors.push(this.newColor());
  }

  removeColor(index: number) {
    this.colors.removeAt(index);
  }

  // sizes inside a color
  getSizes(colorIndex: number): FormArray {
    return this.colors.at(colorIndex).get('sizes') as FormArray;
  }

  newSize(): FormGroup {
    return this.fb.group({
      size_name: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]]
    });
  }

  addSize(colorIndex: number) {
    this.getSizes(colorIndex).push(this.newSize());
  }

  removeSize(colorIndex: number, sizeIndex: number) {
    this.getSizes(colorIndex).removeAt(sizeIndex);
  }
  // ============= IMAGES ==============
  selectedFiles: File[] = [];
  previewUrls: string[] = [];

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        this.selectedFiles.push(file);

        // preview url
        const reader = new FileReader();
        reader.onload = (e: any) => this.previewUrls.push(e.target.result);
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  // ============= SUBMIT ==============
  async submitProduct() {


    if (this.productForm.invalid) {
      console.error('Form invalid!');
      return;
    }
    console.log('Crossed over invalidation !!')
    const formValue = this.productForm.getRawValue();
    const newProduct: Product = {
      title: formValue.title,
      subtitle: formValue.subtitle,
      price: formValue.price,
      discount: formValue.discount,
      final_price: formValue.final_price,
      code: formValue.code,
      category: formValue.category,
      description: formValue.description,
      images: [], // will fill after upload
      rate: formValue.firstRate,
      product_stock: formValue.stock,
      colors: formValue.colors.map((c: any) => ({
        color_name: c.color_name,
        color_code: c.color_code,
        sizes: c.sizes.map((s: any) => ({
          size_name: s.size_name,
          stock: s.stock
        }))
      }))
    };
    console.log('Crossed over save values !!')

    try {
      // 1) Insert product (without images yet)
      const productData = await this.productsService.addProduct(newProduct);
      console.log('Crossed over insert images from products !!')

      // 2) Upload selected images to storage
      if (this.selectedFiles.length > 0) {
        const uploadedUrls: string[] = [];
        console.log('Crossed over selected [1] images from products !!')

        for (const file of this.selectedFiles) {
          const fileName = `${Date.now()}-${file.name}`;
          const filePath = `products/${productData.id}/main/${fileName}`;


          const { data, error } = await this.productsService.uploadImage(filePath, file);
          if (error) throw error;
          console.log('Crossed over selected [2] images from products !!')

          // Get public URL
          const publicUrl = this.productsService.getPublicUrl(filePath);
          uploadedUrls.push(publicUrl);
          console.log('Crossed over selected [3] images from products !!')

        }

        // 3) Update product row with image URLs
        await this.productsService.updateProductImages(productData.id, uploadedUrls);
        console.log('Crossed over update images from products !!')

      }

      console.log('✅ Product inserted successfully with images');
      this.close();
      this.productAdded.emit();

    } catch (err) {
      console.error('❌ Error inserting product:', err);
    }
  }

  close() {
    this.closed.emit();
  }
}
