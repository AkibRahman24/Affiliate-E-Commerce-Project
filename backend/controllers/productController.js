const Product = require('../models/Product');
const AppError = require('../utils/AppError');

const buildImageUrl = (req, imagePath) => {
  if (!imagePath) return imagePath;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const origin = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
  return `${origin}${imagePath}`;
};

exports.buildImageUrl = buildImageUrl;

const normalizeProduct = (product, req) => {
  if (!product) return product;
  return {
    ...product,
    image: buildImageUrl(req, product.image),
  };
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, price, description, image, stock, category, type } = req.body;

    if (!name || price == null || !description || !image || stock == null || !category) {
      return next(new AppError('Provide name, price, description, image, stock, and category', 400));
    }

    const product = await Product.create({
      name,
      price,
      description,
      image,
      stock,
      category,
      type,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: normalizeProduct(product.toObject ? product.toObject() : product, req),
    });
  } catch (error) {
    next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit: rawLimit = 12, category, search, minPrice, maxPrice, sort, active } = req.query;
    const filters = {};

    if (category) {
      filters.category = category;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filters.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (minPrice != null || maxPrice != null) {
      filters.price = {};
      if (minPrice != null) filters.price.$gte = Number(minPrice);
      if (maxPrice != null) filters.price.$lte = Number(maxPrice);
    }

    if (active !== undefined) {
      filters.isActive = active === 'true';
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'name_asc') sortOption = { name: 1 };
    else if (sort === 'name_desc') sortOption = { name: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };

    const total = await Product.countDocuments(filters);

    let products;
    if (rawLimit === 'all') {
      products = await Product.find(filters).sort(sortOption).lean();
    } else {
      const pageNumber = Number(page) || 1;
      const pageSize = Number(rawLimit) || 12;
      const skip = (pageNumber - 1) * pageSize;

      products = await Product.find(filters)
        .sort(sortOption)
        .skip(skip)
        .limit(pageSize)
        .lean();

      res.status(200).json({
        success: true,
        count: products.length,
        page: pageNumber,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        data: products.map((product) => normalizeProduct(product, req)),
      });
      return;
    }

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      data: products.map((product) => normalizeProduct(product, req)),
    });
  } catch (error) {
    next(error);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).lean();

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      success: true,
      data: normalizeProduct(product, req),
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return next(new AppError('Product not found', 404));
    }
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowedFields = ['name', 'price', 'description', 'image', 'stock', 'category', 'type', 'isActive'];
    const updates = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      success: true,
      data: normalizeProduct(product.toObject ? product.toObject() : product, req),
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return next(new AppError('Product not found', 404));
    }
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return next(new AppError('Product not found', 404));
    }
    next(error);
  }
};

exports.adjustStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stockAdded } = req.body;

    if (stockAdded === undefined || stockAdded === null || Number(stockAdded) === 0) {
      return next(new AppError('A non-zero stockAdded delta is required', 400));
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $inc: { stock: Number(stockAdded) } },
      { new: true, runValidators: true }
    );

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      success: true,
      data: normalizeProduct(product.toObject ? product.toObject() : product, req),
    });
  } catch (error) {
    next(error);
  }
};
