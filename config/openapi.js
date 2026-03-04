const resources = [
  { tag: "Categories", basePath: "/api/categories", idName: "id", kind: "single" },
  { tag: "Suppliers", basePath: "/api/suppliers", idName: "id", kind: "single" },
  { tag: "Shippers", basePath: "/api/shippers", idName: "id", kind: "single" },
  { tag: "Region", basePath: "/api/region", idName: "id", kind: "single" },
  { tag: "CustomerDemographics", basePath: "/api/customerdemographics", idName: "id", kind: "single" },
  { tag: "Products", basePath: "/api/products", idName: "id", kind: "single" },
  { tag: "Territories", basePath: "/api/territories", idName: "id", kind: "single" },
  { tag: "Customers", basePath: "/api/customers", idName: "id", kind: "single" },
  { tag: "Employees", basePath: "/api/employees", idName: "id", kind: "single" },
  { tag: "Orders", basePath: "/api/orders", idName: "id", kind: "single" },
  {
    tag: "OrderDetails",
    basePath: "/api/order-details",
    kind: "composite",
    keys: ["orderId", "productId"],
  },
  {
    tag: "CustomerCustomerDemo",
    basePath: "/api/customer-customer-demo",
    kind: "composite",
    keys: ["customerId", "customerTypeId"],
  },
  {
    tag: "EmployeeTerritories",
    basePath: "/api/employee-territories",
    kind: "composite",
    keys: ["employeeId", "territoryId"],
  },
];

const buildSingleResourcePaths = (resource) => {
  const { basePath, tag, idName } = resource;

  return {
    [basePath]: {
      get: {
        tags: [tag],
        summary: `Listar ${tag}`,
        responses: {
          200: { description: "OK" },
          500: { description: "Error interno" },
        },
      },
      post: {
        tags: [tag],
        summary: `Crear ${tag}`,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", additionalProperties: true },
            },
          },
        },
        responses: {
          200: { description: "Creado" },
          201: { description: "Creado" },
          500: { description: "Error interno" },
        },
      },
    },
    [`${basePath}/{${idName}}`]: {
      get: {
        tags: [tag],
        summary: `Obtener ${tag} por ID`,
        parameters: [
          {
            in: "path",
            name: idName,
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "OK" },
          404: { description: "No encontrado" },
          500: { description: "Error interno" },
        },
      },
      put: {
        tags: [tag],
        summary: `Actualizar ${tag} por ID`,
        parameters: [
          {
            in: "path",
            name: idName,
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", additionalProperties: true },
            },
          },
        },
        responses: {
          200: { description: "Actualizado" },
          404: { description: "No encontrado" },
          500: { description: "Error interno" },
        },
      },
      delete: {
        tags: [tag],
        summary: `Eliminar ${tag} por ID`,
        parameters: [
          {
            in: "path",
            name: idName,
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Eliminado" },
          404: { description: "No encontrado" },
          500: { description: "Error interno" },
        },
      },
    },
  };
};

const buildCompositeResourcePaths = (resource) => {
  const { basePath, tag, keys } = resource;
  const compositePath = `${basePath}/{${keys[0]}}/{${keys[1]}}`;

  const commonParameters = keys.map((key) => ({
    in: "path",
    name: key,
    required: true,
    schema: { type: "string" },
  }));

  return {
    [basePath]: {
      get: {
        tags: [tag],
        summary: `Listar ${tag}`,
        responses: {
          200: { description: "OK" },
          500: { description: "Error interno" },
        },
      },
      post: {
        tags: [tag],
        summary: `Crear ${tag}`,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", additionalProperties: true },
            },
          },
        },
        responses: {
          200: { description: "Creado" },
          201: { description: "Creado" },
          500: { description: "Error interno" },
        },
      },
    },
    [compositePath]: {
      get: {
        tags: [tag],
        summary: `Obtener ${tag} por ID compuesto`,
        parameters: commonParameters,
        responses: {
          200: { description: "OK" },
          404: { description: "No encontrado" },
          500: { description: "Error interno" },
        },
      },
      put: {
        tags: [tag],
        summary: `Actualizar ${tag} por ID compuesto`,
        parameters: commonParameters,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", additionalProperties: true },
            },
          },
        },
        responses: {
          200: { description: "Actualizado" },
          404: { description: "No encontrado" },
          500: { description: "Error interno" },
        },
      },
      delete: {
        tags: [tag],
        summary: `Eliminar ${tag} por ID compuesto`,
        parameters: commonParameters,
        responses: {
          200: { description: "Eliminado" },
          404: { description: "No encontrado" },
          500: { description: "Error interno" },
        },
      },
    },
  };
};

const genericPaths = resources.reduce((acc, resource) => {
  const fragment =
    resource.kind === "single"
      ? buildSingleResourcePaths(resource)
      : buildCompositeResourcePaths(resource);

  return { ...acc, ...fragment };
}, {
  "/": {
    get: {
      tags: ["Health"],
      summary: "Ruta de prueba de la API",
      responses: {
        200: { description: "API funcionando" },
      },
    },
  },
});

const detailedPaths = {
  "/api/categories": {
    get: {
      tags: ["Categories"],
      summary: "Listar categorías",
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Category" },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Categories"],
      summary: "Crear categoría",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CategoryInput" },
            example: {
              CategoryName: "Bebidas",
              Description: "Refrescos, cafés y tés",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Creado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateMessageResponse" },
            },
          },
        },
        201: {
          description: "Creado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateMessageResponse" },
            },
          },
        },
      },
    },
  },
  "/api/categories/{id}": {
    get: {
      tags: ["Categories"],
      summary: "Obtener categoría por ID",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer" },
        },
      ],
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Category" },
            },
          },
        },
      },
    },
    put: {
      tags: ["Categories"],
      summary: "Actualizar categoría",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CategoryInput" },
          },
        },
      },
      responses: {
        200: {
          description: "Actualizado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MessageResponse" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Categories"],
      summary: "Eliminar categoría",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer" },
        },
      ],
      responses: {
        200: {
          description: "Eliminado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MessageResponse" },
            },
          },
        },
      },
    },
  },
  "/api/orders": {
    get: {
      tags: ["Orders"],
      summary: "Listar órdenes",
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Order" },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Orders"],
      summary: "Crear orden",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/OrderInput" },
            example: {
              CustomerID: "ALFKI",
              EmployeeID: 1,
              OrderDate: "2026-03-01",
              Freight: 12.5,
              ShipName: "Northwind Express",
              ShipAddress: "Av. Reforma 100",
              ShipCity: "CDMX",
              ShipCountry: "Mexico",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Creado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MySqlWriteResult" },
            },
          },
        },
      },
    },
  },
  "/api/orders/{id}": {
    get: {
      tags: ["Orders"],
      summary: "Obtener orden por ID",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer" },
        },
      ],
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Order" },
            },
          },
        },
      },
    },
    put: {
      tags: ["Orders"],
      summary: "Actualizar orden",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/OrderInput" },
          },
        },
      },
      responses: {
        200: {
          description: "Actualizado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MySqlWriteResult" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Orders"],
      summary: "Eliminar orden",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer" },
        },
      ],
      responses: {
        200: {
          description: "Eliminado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MySqlWriteResult" },
            },
          },
        },
      },
    },
  },
  "/api/order-details": {
    get: {
      tags: ["OrderDetails"],
      summary: "Listar detalles de orden",
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/OrderDetail" },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["OrderDetails"],
      summary: "Crear detalle de orden",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/OrderDetailInput" },
            example: {
              OrderID: 10248,
              ProductID: 11,
              UnitPrice: 14,
              Quantity: 12,
              Discount: 0,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Creado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MySqlWriteResult" },
            },
          },
        },
        201: {
          description: "Creado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MySqlWriteResult" },
            },
          },
        },
      },
    },
  },
  "/api/order-details/{orderId}/{productId}": {
    get: {
      tags: ["OrderDetails"],
      summary: "Obtener detalle por clave compuesta",
      parameters: [
        {
          in: "path",
          name: "orderId",
          required: true,
          schema: { type: "integer" },
          description: "ID de la orden",
        },
        {
          in: "path",
          name: "productId",
          required: true,
          schema: { type: "integer" },
          description: "ID del producto",
        },
      ],
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OrderDetail" },
            },
          },
        },
        404: {
          description: "No encontrado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MessageResponse" },
            },
          },
        },
      },
    },
    put: {
      tags: ["OrderDetails"],
      summary: "Actualizar detalle por clave compuesta",
      parameters: [
        {
          in: "path",
          name: "orderId",
          required: true,
          schema: { type: "integer" },
        },
        {
          in: "path",
          name: "productId",
          required: true,
          schema: { type: "integer" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                UnitPrice: { type: "number", format: "float" },
                Quantity: { type: "integer" },
                Discount: { type: "number", format: "float" },
              },
            },
            example: {
              UnitPrice: 18,
              Quantity: 10,
              Discount: 0.1,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Actualizado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MySqlWriteResult" },
            },
          },
        },
        404: {
          description: "No encontrado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MessageResponse" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["OrderDetails"],
      summary: "Eliminar detalle por clave compuesta",
      parameters: [
        {
          in: "path",
          name: "orderId",
          required: true,
          schema: { type: "integer" },
        },
        {
          in: "path",
          name: "productId",
          required: true,
          schema: { type: "integer" },
        },
      ],
      responses: {
        200: {
          description: "Eliminado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MySqlWriteResult" },
            },
          },
        },
        404: {
          description: "No encontrado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MessageResponse" },
            },
          },
        },
      },
    },
  },
};

const paths = {
  ...genericPaths,
  ...detailedPaths,
};

const components = {
  schemas: {
    MessageResponse: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
    },
    CreateMessageResponse: {
      type: "object",
      properties: {
        message: { type: "string" },
        id: { type: "integer" },
      },
    },
    MySqlWriteResult: {
      type: "object",
      properties: {
        fieldCount: { type: "integer" },
        affectedRows: { type: "integer" },
        insertId: { type: "integer" },
        info: { type: "string" },
        serverStatus: { type: "integer" },
        warningStatus: { type: "integer" },
      },
    },
    Category: {
      type: "object",
      properties: {
        CategoryID: { type: "integer" },
        CategoryName: { type: "string" },
        Description: { type: "string" },
        Picture: { type: "string", nullable: true },
      },
    },
    CategoryInput: {
      type: "object",
      properties: {
        CategoryName: { type: "string" },
        Description: { type: "string" },
      },
      required: ["CategoryName"],
    },
    Order: {
      type: "object",
      properties: {
        OrderID: { type: "integer" },
        CustomerID: { type: "string" },
        EmployeeID: { type: "integer" },
        OrderDate: { type: "string", format: "date-time", nullable: true },
        RequiredDate: { type: "string", format: "date-time", nullable: true },
        ShippedDate: { type: "string", format: "date-time", nullable: true },
        ShipVia: { type: "integer", nullable: true },
        Freight: { type: "number", format: "float", nullable: true },
        ShipName: { type: "string", nullable: true },
        ShipAddress: { type: "string", nullable: true },
        ShipCity: { type: "string", nullable: true },
        ShipRegion: { type: "string", nullable: true },
        ShipPostalCode: { type: "string", nullable: true },
        ShipCountry: { type: "string", nullable: true },
      },
    },
    OrderInput: {
      type: "object",
      properties: {
        CustomerID: { type: "string" },
        EmployeeID: { type: "integer" },
        OrderDate: { type: "string", format: "date" },
        RequiredDate: { type: "string", format: "date" },
        ShippedDate: { type: "string", format: "date" },
        ShipVia: { type: "integer" },
        Freight: { type: "number", format: "float" },
        ShipName: { type: "string" },
        ShipAddress: { type: "string" },
        ShipCity: { type: "string" },
        ShipRegion: { type: "string" },
        ShipPostalCode: { type: "string" },
        ShipCountry: { type: "string" },
      },
    },
    OrderDetail: {
      type: "object",
      properties: {
        OrderID: { type: "integer" },
        ProductID: { type: "integer" },
        UnitPrice: { type: "number", format: "float" },
        Quantity: { type: "integer" },
        Discount: { type: "number", format: "float" },
      },
    },
    OrderDetailInput: {
      type: "object",
      properties: {
        OrderID: { type: "integer" },
        ProductID: { type: "integer" },
        UnitPrice: { type: "number", format: "float" },
        Quantity: { type: "integer" },
        Discount: { type: "number", format: "float" },
      },
      required: ["OrderID", "ProductID", "UnitPrice", "Quantity", "Discount"],
    },
  },
};

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Northwind API",
    version: "1.0.0",
    description: "Documentación Swagger de la API CRUD Northwind.",
  },
  servers: [{ url: "http://localhost:3000", description: "Local" }],
  tags: [
    { name: "Health" },
    ...resources.map((resource) => ({ name: resource.tag })),
  ],
  paths,
  components,
};

module.exports = openApiSpec;