import { Component, EventEmitter, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductsService } from '../../../services/products.service';
import { Product } from '../../../interface/product';
import Swal from 'sweetalert2'; // SweetAlert2

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent {

  productForm: FormGroup;
  @Output() closed = new EventEmitter<void>();
  @Output() productAdded = new EventEmitter<void>();

  // état de chargement
  isSaving = false;

  // image par défaut quand aucun visuel n'est uploadé
  private readonly DEFAULT_IMAGE = 'images/shopping/defaultProductImage.jpg';

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

    // mise à jour automatique du prix final
    this.productForm.get('price')?.valueChanges.subscribe(() => this.updateFinalPrice());
    this.productForm.get('discount')?.valueChanges.subscribe(() => this.updateFinalPrice());
  }

  // prix final
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

  // nouveau groupe couleur
  newColor(): FormGroup {
    return this.fb.group({
      color_name: ['', Validators.required],
      color_code: ['#000000', Validators.required],
      sizes: this.fb.array([])
    });
  }

  addColor() {
    this.colors.push(this.newColor());
  }

  removeColor(index: number) {
    this.colors.removeAt(index);
  }

  // tailles pour une couleur
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
      // alerte de validation en français
      Swal.fire({
        icon: 'warning',
        title: 'Formulaire incomplet',
        text: 'Veuillez remplir les champs requis avant d\'enregistrer.'
      });
      return;
    }

    this.isSaving = true; // démarrer le chargement

    const formValue = this.productForm.getRawValue();

    // si aucune image sélectionnée, on prépare déjà l'image par défaut
    const initialImages = this.selectedFiles.length > 0 ? [] : [this.DEFAULT_IMAGE];

    const newProduct: Product = {
      title: formValue.title,
      subtitle: formValue.subtitle,
      price: formValue.price,
      discount: formValue.discount,
      final_price: formValue.final_price,
      code: formValue.code,
      category: formValue.category,
      description: formValue.description,
      images: initialImages,
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

    try {
      // 1) Insérer le produit (sans les images uploadées pour l'instant)
      const productData: any = await this.productsService.addProduct(newProduct);

      // certaines implémentations renvoient { data, error } au lieu de throw
      if (!productData) throw new Error('No response from server when inserting product.');
      if (productData.error) throw productData.error;

      // récupérer l'id du produit (selon la forme de la réponse)
      const productId = productData.id ?? (productData.data && productData.data.id) ?? null;
      if (!productId) {
        throw new Error('Product ID was not returned after creation.');
      }

      // 2) Si des fichiers ont été sélectionnés -> upload et remplacement des images
      if (this.selectedFiles.length > 0) {
        const uploadedUrls: string[] = [];

        for (const file of this.selectedFiles) {
          const fileName = `${Date.now()}-${file.name}`;
          const filePath = `products/${productId}/main/${fileName}`;

          const { data, error } = await this.productsService.uploadImage(filePath, file);
          if (error) throw error;

          const publicUrl = this.productsService.getPublicUrl(filePath);
          uploadedUrls.push(publicUrl);
        }

        // mettre à jour la ligne produit avec les URLs uploadées
        const updateResult: any = await this.productsService.updateProductImages(productId, uploadedUrls);
        if (updateResult && updateResult.error) throw updateResult.error;
      } else {
        // 3) aucun fichier sélectionné -> s'assurer que l'image par défaut est bien enregistrée en DB
        const updateResult: any = await this.productsService.updateProductImages(productId, [this.DEFAULT_IMAGE]);
        if (updateResult && updateResult.error) throw updateResult.error;
      }

      // succès
      this.isSaving = false;
      Swal.fire({
        icon: 'success',
        title: 'Enregistré',
        text: 'Produit ajouté avec succès.'
      });

      this.close();
      this.productAdded.emit();

    } catch (err: any) {
      this.isSaving = false;

      // décoder les messages d'erreur les plus courants (Supabase / RLS / réseau)
      let userMessage = 'Une erreur inattendue est survenue. Veuillez réessayer.';
      if (!err) {
        userMessage = 'Une erreur inconnue est survenue.';
      } else if (err.message) {
        userMessage = err.message;
      } else if (err.error_description) {
        userMessage = err.error_description;
      } else if (typeof err === 'string') {
        userMessage = err;
      } else {
        userMessage = JSON.stringify(err).slice(0, 500);
      }

      // détecter des cas fréquents (RLS / 403)
      if (userMessage.toLowerCase().includes('row-level security') || userMessage.includes('42501')) {
        userMessage = 'Insertion refusée en raison de la sécurité au niveau des lignes (RLS). Vérifiez les politiques de table, incluez le user_id requis, ou ajustez la politique d\'insertion.';
      } else if (userMessage.toLowerCase().includes('forbidden') || userMessage.includes('403')) {
        userMessage = 'Requête interdite (403). Vérifiez votre clé API (anon/service_role), les politiques de table et les paramètres CORS.';
      }

      // afficher SweetAlert avec l'erreur en français
      Swal.fire({
        icon: 'error',
        title: 'Échec de l\'enregistrement',
        html: `<pre style="text-align:left; white-space:pre-wrap;">${this.escapeHtml(userMessage)}</pre>`
      });

      // log développeur
      console.error('❌ Error inserting product:', err);
    }
  }

  // close
  close() {
    this.closed.emit();
  }

  // aide pour échapper le HTML avant insertion dans SweetAlert
  private escapeHtml(str: string) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
