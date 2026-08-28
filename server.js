const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();

const PORT = 5000;


/* =====================================================
   ADMIN LOGIN DETAILS
===================================================== */

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Admin@12345";


/* =====================================================
   PATHS
===================================================== */

const FRONTEND_PATH = path.join(__dirname, "front-end");
const uploadsPath = path.join(__dirname, "uploads");


/* =====================================================
   CHECK FRONTEND FOLDER
===================================================== */

if (!fs.existsSync(FRONTEND_PATH)) {

    console.error(
        "ERROR: front-end folder was not found."
    );

    console.error(
        "Expected location:",
        FRONTEND_PATH
    );

}


/* =====================================================
   CREATE UPLOADS FOLDER
===================================================== */

if (!fs.existsSync(uploadsPath)) {

    fs.mkdirSync(
        uploadsPath,
        {
            recursive: true
        }
    );

}

console.log(
    "Uploads folder:",
    uploadsPath
);


/* =====================================================
   MULTER CONFIGURATION
===================================================== */

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(
            null,
            uploadsPath
        );

    },

    filename: function (req, file, cb) {

        const safeName =
            file.originalname.replace(
                /[^a-zA-Z0-9.-]/g,
                "-"
            );

        const uniqueName =
            Date.now() +
            "-" +
            safeName;

        cb(
            null,
            uniqueName
        );

    }

});


const upload = multer({

    storage: storage,

    limits: {

        fileSize:
            10 * 1024 * 1024

    },

    fileFilter:
        function (req, file, cb) {

            const allowedTypes = [

                "image/jpeg",
                "image/png",
                "image/jpg",
                "application/pdf"

            ];

            if (
                allowedTypes.includes(
                    file.mimetype
                )
            ) {

                cb(
                    null,
                    true
                );

            } else {

                cb(
                    new Error(
                        "Only JPG, PNG and PDF files are allowed."
                    )
                );

            }

        }

});


/* =====================================================
   CORS
===================================================== */

app.use(
    cors({

        origin: [

            "http://localhost:5000",
            "http://127.0.0.1:5000",

            "http://localhost:5500",
            "http://127.0.0.1:5500"

        ],

        credentials: true

    })
);


/* =====================================================
   BODY PARSERS
===================================================== */

app.use(
    express.json()
);

app.use(
    express.urlencoded({

        extended: true

    })
);


/* =====================================================
   SESSION
===================================================== */

app.use(
    session({

        secret:
            "hostel_secret_key_change_this_later",

        resave:
            false,

        saveUninitialized:
            false,

        cookie: {

            secure:
                false,

            httpOnly:
                true,

            sameSite:
                "lax",

            maxAge:
                1000 *
                60 *
                60 *
                24

        }

    })
);


/* =====================================================
   REQUEST LOGGER
   THIS WILL HELP FIND API ROUTE PROBLEMS
===================================================== */

app.use(
    function (req, res, next) {

        if (
            req.originalUrl.startsWith("/api")
        ) {

            console.log(
                `[API REQUEST] ${req.method} ${req.originalUrl}`
            );

        }

        next();

    }
);


/* =====================================================
   ADMIN AUTHENTICATION
===================================================== */

function adminAuth(
    req,
    res,
    next
) {

    if (
        req.session &&
        req.session.admin
    ) {

        return next();

    }

    return res.status(403).json({

        success:
            false,

        message:
            "Administrator access required."

    });

}


/* =====================================================
   STUDENT AUTHENTICATION
===================================================== */

function studentAuth(
    req,
    res,
    next
) {

    if (
        req.session &&
        req.session.user
    ) {

        return next();

    }

    return res.status(401).json({

        success:
            false,

        message:
            "Please login first."

    });

}


/* =====================================================
   DATABASE CONNECTION
===================================================== */

mongoose
    .connect(
        "mongodb://127.0.0.1:27017/hostelDB"
    )
    .then(
        function () {

            console.log(
                "MongoDB Connected"
            );

        }
    )
    .catch(
        function (err) {

            console.error(
                "MongoDB Error:",
                err
            );

        }
    );


/* =====================================================
   USER MODEL
===================================================== */

const userSchema =
    new mongoose.Schema({

        name: {

            type:
                String,

            required:
                true

        },

        matric: {

            type:
                String,

            unique:
                true,

            required:
                true

        },

        email: {

            type:
                String,

            unique:
                true,

            required:
                true

        },

        level: {

            type:
                String,

            required:
                true

        },

        gender: {

            type:
                String,

            required:
                true

        },

        password: {

            type:
                String,

            required:
                true

        },


        /* =========================
           PAYMENT
        ========================= */

        paymentStatus: {

            type:
                String,

            default:
                "Not Submitted"

        },

        verificationStatus: {

            type:
                String,

            default:
                "Pending"

        },


        /* =========================
           HOSTEL ALLOCATION
        ========================= */

        hostelBlock: {

            type:
                String,

            default:
                null

        },

        roomNumber: {

            type:
                String,

            default:
                null

        },

        roomCapacity: {

            type:
                Number,

            enum:
                [4, 6, 8],

            default:
                null

        },


        /* =========================
           RECEIPT
        ========================= */

        receipt: {

            filename: {

                type:
                    String,

                default:
                    null

            },

            originalName: {

                type:
                    String,

                default:
                    null

            },

            path: {

                type:
                    String,

                default:
                    null

            },

            uploadedAt: {

                type:
                    Date,

                default:
                    null

            }

        }

    });


const User =
    mongoose.model(
        "User",
        userSchema
    );


/* =====================================================
   ADMIN HTML PROTECTION
===================================================== */

app.get(
    "/admin.html",
    function (req, res) {

        if (
            !req.session ||
            !req.session.admin
        ) {

            return res.redirect(
                "/admin-login.html"
            );

        }

        return res.sendFile(
            path.join(
                FRONTEND_PATH,
                "admin.html"
            )
        );

    }
);


/* =====================================================
   STATIC FRONTEND
===================================================== */

app.use(
    express.static(
        FRONTEND_PATH
    )
);


/* =====================================================
   PROTECTED UPLOAD VIEWING
===================================================== */

app.get(
    "/uploads/:filename",
    adminAuth,
    function (req, res) {

        const filename =
            path.basename(
                req.params.filename
            );

        const filePath =
            path.join(
                uploadsPath,
                filename
            );

        if (
            !fs.existsSync(
                filePath
            )
        ) {

            return res.status(404).send(
                "Receipt not found."
            );

        }

        return res.sendFile(
            filePath
        );

    }
);


/* =====================================================
   DEFAULT ROUTE
===================================================== */

app.get(
    "/",
    function (req, res) {

        return res.sendFile(
            path.join(
                FRONTEND_PATH,
                "login.html"
            )
        );

    }
);


/* =====================================================
   FRONTEND ROUTES
===================================================== */

app.get(
    "/dashboard",
    function (req, res) {

        return res.sendFile(
            path.join(
                FRONTEND_PATH,
                "dashboard.html"
            )
        );

    }
);


app.get(
    "/register",
    function (req, res) {

        return res.sendFile(
            path.join(
                FRONTEND_PATH,
                "register.html"
            )
        );

    }
);


app.get(
    "/allocation",
    function (req, res) {

        return res.sendFile(
            path.join(
                FRONTEND_PATH,
                "allocation.html"
            )
        );

    }
);


app.get(
    "/payment",
    function (req, res) {

        return res.sendFile(
            path.join(
                FRONTEND_PATH,
                "payment.html"
            )
        );

    }
);


/* =====================================================
   REGISTER
===================================================== */

app.post(
    "/register",
    async function (req, res) {

        try {

            let {
                name,
                matric,
                email,
                level,
                gender,
                password
            } = req.body;


            if (
                !name ||
                !matric ||
                !email ||
                !level ||
                !gender ||
                !password
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Please fill all required fields."

                });

            }


            matric =
                matric
                    .trim()
                    .toUpperCase();


            email =
                email
                    .trim()
                    .toLowerCase();


            const exists =
                await User.findOne({

                    $or: [

                        {
                            matric:
                                matric
                        },

                        {
                            email:
                                email
                        }

                    ]

                });


            if (exists) {

                return res.status(409).json({

                    success:
                        false,

                    message:
                        "User already exists."

                });

            }


            const hashed =
                await bcrypt.hash(
                    password,
                    10
                );


            await User.create({

                name:
                    name.trim(),

                matric:
                    matric,

                email:
                    email,

                level:
                    level,

                gender:
                    gender,

                password:
                    hashed

            });


            return res.status(201).json({

                success:
                    true,

                message:
                    "Registration successful."

            });

        }

        catch (err) {

            console.error(
                "Register Error:",
                err
            );

            return res.status(500).json({

                success:
                    false,

                message:
                    "Registration failed."

            });

        }

    }
);


/* =====================================================
   STUDENT LOGIN
===================================================== */

app.post(
    "/login",
    async function (req, res) {

        try {

            let {
                matric,
                password
            } = req.body;


            if (
                !matric ||
                !password
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Matric number and password are required."

                });

            }


            matric =
                matric
                    .trim()
                    .toUpperCase();


            console.log(
                "Login attempt:",
                matric
            );


            const user =
                await User.findOne({
                    matric:
                        matric
                });


            if (!user) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "User not found."

                });

            }


            const match =
                await bcrypt.compare(
                    password,
                    user.password
                );


            if (!match) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Wrong password."

                });

            }


            /* =========================
               CLEAR ADMIN SESSION
            ========================= */

            req.session.admin =
                null;


            /* =========================
               CREATE STUDENT SESSION
            ========================= */

            req.session.user = {

                id:
                    user._id.toString(),

                name:
                    user.name,

                matric:
                    user.matric,

                gender:
                    user.gender

            };


            req.session.save(
                function (err) {

                    if (err) {

                        console.error(
                            "Session error:",
                            err
                        );

                        return res.status(500).json({

                            success:
                                false,

                            message:
                                "Session error."

                        });

                    }


                    console.log(
                        "Login successful:",
                        user.matric
                    );


                    return res.json({

                        success:
                            true,

                        message:
                            "Login successful.",

                        name:
                            user.name

                    });

                }
            );

        }

        catch (err) {

            console.error(
                "Login Error:",
                err
            );

            return res.status(500).json({

                success:
                    false,

                message:
                    "Login failed."

            });

        }

    }
);


/* =====================================================
   ADMIN LOGIN
===================================================== */

app.post(
    "/admin/login",
    function (req, res) {

        const {
            username,
            password
        } = req.body;


        if (
            !username ||
            !password
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Username and password are required."

            });

        }


        if (
            username !== ADMIN_USERNAME ||
            password !== ADMIN_PASSWORD
        ) {

            return res.status(401).json({

                success:
                    false,

                message:
                    "Invalid administrator credentials."

            });

        }


        req.session.user =
            null;


        req.session.admin = {

            username:
                ADMIN_USERNAME,

            role:
                "admin"

        };


        req.session.save(
            function (err) {

                if (err) {

                    console.error(
                        "Admin session error:",
                        err
                    );

                    return res.status(500).json({

                        success:
                            false,

                        message:
                            "Unable to create admin session."

                    });

                }


                console.log(
                    "Admin logged in."
                );


                return res.json({

                    success:
                        true,

                    message:
                        "Admin login successful."

                });

            }
        );

    }
);


/* =====================================================
   ADMIN SESSION CHECK
===================================================== */

app.get(
    "/admin/check",
    adminAuth,
    function (req, res) {

        return res.json({

            success:
                true,

            admin: {

                username:
                    req.session.admin.username,

                role:
                    req.session.admin.role

            }

        });

    }
);


/* =====================================================
   ADMIN LOGOUT
===================================================== */

app.post(
    "/admin/logout",
    adminAuth,
    function (req, res) {

        req.session.destroy(
            function (err) {

                if (err) {

                    console.error(
                        "Admin logout error:",
                        err
                    );

                    return res.status(500).json({

                        success:
                            false,

                        message:
                            "Logout failed."

                    });

                }


                res.clearCookie(
                    "connect.sid"
                );


                return res.json({

                    success:
                        true,

                    message:
                        "Admin logged out successfully."

                });

            }
        );

    }
);


/* =====================================================
   GET CURRENT USER
===================================================== */

app.get(
    "/api/user",
    async function (req, res) {

        try {

            console.log(
                "Checking current student session..."
            );


            if (
                !req.session.user
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Not logged in."

                });

            }


            const user =
                await User.findById(
                    req.session.user.id
                ).select(
                    "-password"
                );


            if (!user) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "User not found."

                });

            }


            return res.json({

                success:
                    true,

                user:
                    user

            });

        }

        catch (err) {

            console.error(
                "User Fetch Error:",
                err
            );

            return res.status(500).json({

                success:
                    false,

                message:
                    "Failed to fetch user."

            });

        }

    }
);


/* =====================================================
   STUDENT LOGOUT
===================================================== */

app.post(
    "/logout",
    function (req, res) {

        req.session.destroy(
            function (err) {

                if (err) {

                    console.error(
                        "Logout error:",
                        err
                    );

                    return res.status(500).json({

                        success:
                            false,

                        message:
                            "Logout failed."

                    });

                }


                res.clearCookie(
                    "connect.sid"
                );


                return res.json({

                    success:
                        true,

                    message:
                        "Logged out successfully."

                });

            }
        );

    }
);


/* =====================================================
   ADMIN GET USERS
===================================================== */

app.get(
    "/admin/users",
    adminAuth,
    async function (req, res) {

        try {

            const users =
                await User
                    .find({})
                    .select(
                        "-password"
                    );


            return res.json({

                success:
                    true,

                users:
                    users

            });

        }

        catch (err) {

            console.error(
                "Admin users error:",
                err
            );

            return res.status(500).json({

                success:
                    false,

                message:
                    "Failed to load users."

            });

        }

    }
);


/* =====================================================
   ADMIN APPROVE PAYMENT
===================================================== */

app.post(
    "/admin/approve",
    adminAuth,
    async function (req, res) {

        try {

            const {
                id
            } = req.body;


            if (!id) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "User ID is required."

                });

            }


            const user =
                await User.findByIdAndUpdate(

                    id,

                    {

                        /*
                         * IMPORTANT:
                         * Allocation checks these values.
                         */

                        paymentStatus:
                            "VERIFIED",

                        verificationStatus:
                            "APPROVED"

                    },

                    {
                        new:
                            true
                    }

                );


            if (!user) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "User not found."

                });

            }


            console.log(
                "Payment approved:",
                user.matric
            );


            return res.json({

                success:
                    true,

                message:
                    "Payment approved successfully."

            });

        }

        catch (err) {

            console.error(
                "Approve error:",
                err
            );

            return res.status(500).json({

                success:
                    false,

                message:
                    "Failed to approve payment."

            });

        }

    }
);


/* =====================================================
   ADMIN REJECT PAYMENT
===================================================== */

app.post(
    "/admin/reject",
    adminAuth,
    async function (req, res) {

        try {

            const {
                id
            } = req.body;


            if (!id) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "User ID is required."

                });

            }


            const user =
                await User.findByIdAndUpdate(

                    id,

                    {

                        paymentStatus:
                            "REJECTED",

                        verificationStatus:
                            "REJECTED"

                    },

                    {
                        new:
                            true
                    }

                );


            if (!user) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "User not found."

                });

            }


            console.log(
                "Payment rejected:",
                user.matric
            );


            return res.json({

                success:
                    true,

                message:
                    "Payment rejected."

            });

        }

        catch (err) {

            console.error(
                "Reject error:",
                err
            );

            return res.status(500).json({

                success:
                    false,

                message:
                    "Failed to reject payment."

            });

        }

    }
);


/* =====================================================
   PAYMENT RECEIPT UPLOAD
===================================================== */

app.post(
    "/api/payment/upload",
    upload.single("receipt"),
    async function (req, res) {

        try {

            console.log(
                "Receipt upload request received."
            );


            if (
                !req.session.user
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Please login first."

                });

            }


            if (
                !req.file
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "No receipt uploaded."

                });

            }


            const user =
                await User.findById(
                    req.session.user.id
                );


            if (!user) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Student account not found."

                });

            }


            user.receipt = {

                filename:
                    req.file.filename,

                originalName:
                    req.file.originalname,

                path:
                    req.file.path,

                uploadedAt:
                    new Date()

            };


            user.paymentStatus =
                "SUBMITTED";


            user.verificationStatus =
                "PENDING";


            await user.save();


            console.log(
                "Receipt saved for:",
                user.matric
            );


            return res.status(200).json({

                success:
                    true,

                message:
                    "Receipt uploaded successfully. Awaiting verification.",

                file: {

                    filename:
                        req.file.filename,

                    originalName:
                        req.file.originalname

                }

            });

        }

        catch (error) {

            console.error(
                "RECEIPT UPLOAD ERROR:",
                error
            );

            return res.status(500).json({

                success:
                    false,

                message:
                    error.message ||
                    "Failed to upload receipt."

            });

        }

    }
);


/* =====================================================
   PAYMENT API TEST
===================================================== */

app.get(
    "/api/payment/test",
    function (req, res) {

        return res.status(200).json({

            success:
                true,

            message:
                "Payment API is working."

        });

    }
);


/* =====================================================
   ALLOCATION CONFIGURATION
===================================================== */

const VALID_BLOCKS = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H"
];

const MALE_BLOCKS = [
    "E",
    "F",
    "G"
];

const FEMALE_BLOCKS = [
    "A",
    "B",
    "C",
    "D",
    "H"
];

const VALID_CAPACITIES = [
    4,
    6,
    8
];


/* =====================================================
   CHECK GENDER BLOCK
===================================================== */

function checkGenderBlock(
    gender,
    block
) {

    const normalizedGender =
        String(
            gender || ""
        )
            .trim()
            .toLowerCase();


    if (
        normalizedGender === "male" &&
        FEMALE_BLOCKS.includes(block)
    ) {

        return {
            valid:
                false,

            message:
                "Male students can only select Blocks E, F, or G."
        };

    }


    if (
        normalizedGender === "female" &&
        MALE_BLOCKS.includes(block)
    ) {

        return {
            valid:
                false,

            message:
                "Female students can only select Blocks A, B, C, D, or H."
        };

    }


    return {
        valid:
            true
    };

}


/* =====================================================
   GET AVAILABLE ROOMS
===================================================== */

app.get(
    "/api/allocation/rooms",
    studentAuth,
    async function (req, res) {

        try {

            console.log(
                "===================================="
            );

            console.log(
                "ALLOCATION ROOMS REQUEST"
            );

            console.log(
                "Query:",
                req.query
            );


            const block =
                String(
                    req.query.block || ""
                )
                    .trim()
                    .toUpperCase();


            const capacity =
                Number(
                    req.query.capacity
                );


            /* =========================
               VALID BLOCK
            ========================= */

            if (
                !VALID_BLOCKS.includes(
                    block
                )
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid hostel block."

                });

            }


            /* =========================
               VALID CAPACITY
            ========================= */

            if (
                !VALID_CAPACITIES.includes(
                    capacity
                )
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Room capacity must be 4, 6, or 8."

                });

            }


            /* =========================
               GET USER
            ========================= */

            const currentUser =
                await User.findById(
                    req.session.user.id
                );


            if (!currentUser) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Student account not found."

                });

            }


            /* =========================
               PAYMENT CHECK
            ========================= */

            const paymentStatus =
                String(
                    currentUser.paymentStatus || ""
                )
                    .trim()
                    .toUpperCase();


            const verificationStatus =
                String(
                    currentUser.verificationStatus || ""
                )
                    .trim()
                    .toUpperCase();


            if (
                paymentStatus !== "VERIFIED" ||
                verificationStatus !== "APPROVED"
            ) {

                return res.status(403).json({

                    success:
                        false,

                    message:
                        "Your payment must be verified by the administrator before hostel allocation."

                });

            }


            /* =========================
               ALREADY ALLOCATED
            ========================= */

            if (
                currentUser.hostelBlock &&
                currentUser.roomNumber
            ) {

                return res.status(409).json({

                    success:
                        false,

                    message:
                        "You already have a hostel allocation."

                });

            }


            /* =========================
               GENDER
            ========================= */

            const genderCheck =
                checkGenderBlock(
                    currentUser.gender,
                    block
                );


            if (
                !genderCheck.valid
            ) {

                return res.status(403).json({

                    success:
                        false,

                    message:
                        genderCheck.message

                });

            }


            /* =========================
               FIND ALLOCATED STUDENTS
            ========================= */

            const allocatedStudents =
                await User.find({

                    hostelBlock:
                        block,

                    roomNumber:
                        {
                            $ne:
                                null
                        }

                }).select(
                    "roomNumber roomCapacity"
                );


            /* =========================
               BUILD ROOMS
            ========================= */

            const rooms = [];


            for (
                let roomNumber = 1;
                roomNumber <= 20;
                roomNumber++
            ) {

                const roomStudents =
                    allocatedStudents.filter(
                        function (student) {

                            return String(
                                student.roomNumber
                            ) ===
                                String(
                                    roomNumber
                                );

                        }
                    );


                let roomCapacity =
                    capacity;


                /* =========================
                   EXISTING ROOM CAPACITY
                ========================= */

                if (
                    roomStudents.length > 0
                ) {

                    const existingCapacity =
                        roomStudents[0]
                            .roomCapacity;


                    if (
                        existingCapacity
                    ) {

                        roomCapacity =
                            Number(
                                existingCapacity
                            );

                    }

                }


                /* =========================
                   DON'T MIX CAPACITIES
                ========================= */

                if (
                    roomStudents.length > 0 &&
                    roomCapacity !== capacity
                ) {

                    continue;

                }


                const occupied =
                    roomStudents.length;


                const availableSpaces =
                    Math.max(
                        roomCapacity -
                        occupied,
                        0
                    );


                rooms.push({

                    roomNumber:
                        String(
                            roomNumber
                        ),

                    capacity:
                        roomCapacity,

                    occupied:
                        occupied,

                    availableSpaces:
                        availableSpaces,

                    full:
                        availableSpaces <= 0

                });

            }


            console.log(
                "Rooms returned:",
                rooms.length
            );


            console.log(
                "===================================="
            );


            return res.json({

                success:
                    true,

                block:
                    block,

                capacity:
                    capacity,

                rooms:
                    rooms

            });

        }

        catch (error) {

            console.error(
                "LOAD ROOMS ERROR:",
                error
            );

            return res.status(500).json({

                success:
                    false,

                message:
                    "Failed to load room availability."

            });

        }

    }
);


/* =====================================================
   BOOK HOSTEL ROOM
===================================================== */

app.post(
    "/api/allocation/book",
    studentAuth,
    async function (req, res) {

        try {

            console.log(
                "===================================="
            );

            console.log(
                "HOSTEL BOOKING REQUEST"
            );

            console.log(
                "Body:",
                req.body
            );


            const {
                block,
                roomNumber,
                capacity
            } = req.body;


            const selectedBlock =
                String(
                    block || ""
                )
                    .trim()
                    .toUpperCase();


            const selectedRoom =
                String(
                    roomNumber || ""
                )
                    .trim();


            const selectedCapacity =
                Number(
                    capacity
                );


            /* =========================
               VALID BLOCK
            ========================= */

            if (
                !VALID_BLOCKS.includes(
                    selectedBlock
                )
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid hostel block."

                });

            }


            /* =========================
               VALID ROOM
            ========================= */

            const roomNumberInt =
                Number(
                    selectedRoom
                );


            if (
                !Number.isInteger(
                    roomNumberInt
                ) ||
                roomNumberInt < 1 ||
                roomNumberInt > 20
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid room number."

                });

            }


            /* =========================
               VALID CAPACITY
            ========================= */

            if (
                !VALID_CAPACITIES.includes(
                    selectedCapacity
                )
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid room capacity."

                });

            }


            /* =========================
               CURRENT USER
            ========================= */

            const user =
                await User.findById(
                    req.session.user.id
                );


            if (!user) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Student account not found."

                });

            }


            /* =========================
               PAYMENT CHECK
            ========================= */

            const paymentStatus =
                String(
                    user.paymentStatus || ""
                )
                    .trim()
                    .toUpperCase();


            const verificationStatus =
                String(
                    user.verificationStatus || ""
                )
                    .trim()
                    .toUpperCase();


            if (
                paymentStatus !== "VERIFIED" ||
                verificationStatus !== "APPROVED"
            ) {

                return res.status(403).json({

                    success:
                        false,

                    message:
                        "Your payment must be verified by the administrator before hostel allocation."

                });

            }


            /* =========================
               DOUBLE ALLOCATION
            ========================= */

            if (
                user.hostelBlock &&
                user.roomNumber
            ) {

                return res.status(409).json({

                    success:
                        false,

                    message:
                        "You already have a hostel allocation."

                });

            }


            /* =========================
               GENDER CHECK
            ========================= */

            const genderCheck =
                checkGenderBlock(
                    user.gender,
                    selectedBlock
                );


            if (
                !genderCheck.valid
            ) {

                return res.status(403).json({

                    success:
                        false,

                    message:
                        genderCheck.message

                });

            }


            /* =========================
               FIND EXISTING STUDENTS
            ========================= */

            const existingStudents =
                await User.find({

                    hostelBlock:
                        selectedBlock,

                    roomNumber:
                        selectedRoom

                }).select(
                    "roomCapacity"
                );


            let actualRoomCapacity =
                selectedCapacity;


            /* =========================
               EXISTING ROOM
            ========================= */

            if (
                existingStudents.length > 0
            ) {

                const existingCapacity =
                    existingStudents[0]
                        .roomCapacity;


                if (
                    existingCapacity &&
                    Number(existingCapacity) !==
                    selectedCapacity
                ) {

                    return res.status(409).json({

                        success:
                            false,

                        message:
                            "This room already uses a different capacity."

                    });

                }


                if (
                    existingCapacity
                ) {

                    actualRoomCapacity =
                        Number(
                            existingCapacity
                        );

                }

            }


            /* =========================
               CHECK ROOM CAPACITY
            ========================= */

            if (
                existingStudents.length >=
                actualRoomCapacity
            ) {

                return res.status(409).json({

                    success:
                        false,

                    message:
                        "Sorry, this room is already full. Please select another room."

                });

            }


            /* =========================
               ALLOCATE
            ========================= */

            user.hostelBlock =
                selectedBlock;


            user.roomNumber =
                selectedRoom;


            user.roomCapacity =
                actualRoomCapacity;


            await user.save();


            console.log(
                "HOSTEL ALLOCATION SUCCESS"
            );

            console.log(
                "Student:",
                user.matric
            );

            console.log(
                "Block:",
                selectedBlock
            );

            console.log(
                "Room:",
                selectedRoom
            );

            console.log(
                "Capacity:",
                actualRoomCapacity
            );

            console.log(
                "===================================="
            );


            return res.status(200).json({

                success:
                    true,

                message:
                    "Hostel allocated successfully.",

                hostelBlock:
                    selectedBlock,

                roomNumber:
                    selectedRoom,

                roomCapacity:
                    actualRoomCapacity

            });

        }

        catch (error) {

            console.error(
                "BOOK ROOM ERROR:",
                error
            );

            return res.status(500).json({

                success:
                    false,

                message:
                    "Failed to allocate hostel room."

            });

        }

    }
);


/* =====================================================
   ALLOCATION API TEST
===================================================== */

app.get(
    "/api/allocation/test",
    function (req, res) {

        return res.status(200).json({

            success:
                true,

            message:
                "Allocation API is working.",

            routes: [

                "GET /api/user",

                "GET /api/allocation/rooms",

                "POST /api/allocation/book",

                "GET /api/allocation/test"

            ]

        });

    }
);


/* =====================================================
   GENERAL API TEST
===================================================== */

app.get(
    "/api/test",
    function (req, res) {

        return res.status(200).json({

            success:
                true,

            message:
                "API is working correctly."

        });

    }
);


/* =====================================================
   TEST SESSION
===================================================== */

app.get(
    "/test-session",
    function (req, res) {

        return res.json({

            session:
                req.session,

            user:
                req.session.user ||
                null,

            admin:
                req.session.admin ||
                null

        });

    }
);


/* =====================================================
   API 404 HANDLER
   MUST BE LAST AMONG API ROUTES
===================================================== */

app.use(
    "/api",
    function (req, res) {

        console.error(
            "API ROUTE NOT FOUND:",
            req.method,
            req.originalUrl
        );


        return res.status(404).json({

            success:
                false,

            message:
                "API route not found.",

            requestedRoute:
                req.originalUrl,

            method:
                req.method

        });

    }
);


/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

app.use(
    function (
        err,
        req,
        res,
        next
    ) {

        console.error(
            "===================================="
        );

        console.error(
            "GLOBAL SERVER ERROR"
        );

        console.error(
            err
        );

        console.error(
            "===================================="
        );


        /* =========================
           MULTER ERROR
        ========================= */

        if (
            err instanceof
            multer.MulterError
        ) {

            if (
                err.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "File is too large. Maximum size is 10MB."

                });

            }


            return res.status(400).json({

                success:
                    false,

                message:
                    err.message

            });

        }


        /* =========================
           OTHER ERRORS
        ========================= */

        return res.status(500).json({

            success:
                false,

            message:
                err.message ||
                "Something went wrong on the server."

        });

    }
);


/* =====================================================
   START SERVER
===================================================== */

app.listen(
    PORT,
    function () {

        console.log("");

        console.log(
            "===================================="
        );

        console.log(
            "HOSTEL ALLOCATION SYSTEM"
        );

        console.log(
            "===================================="
        );

        console.log(
            `Server running on http://localhost:${PORT}`
        );

        console.log(
            `Frontend: http://localhost:${PORT}/`
        );

        console.log(
            `Student Login: http://localhost:${PORT}/login.html`
        );

        console.log(
            `Student Register: http://localhost:${PORT}/register.html`
        );

        console.log(
            `Dashboard: http://localhost:${PORT}/dashboard.html`
        );

        console.log(
            `Allocation: http://localhost:${PORT}/allocation.html`
        );

        console.log(
            `Payment: http://localhost:${PORT}/payment.html`
        );

        console.log(
            `Admin Login: http://localhost:${PORT}/admin-login.html`
        );

        console.log(
            `Admin Dashboard: http://localhost:${PORT}/admin.html`
        );

        console.log(
            `API Test: http://localhost:${PORT}/api/test`
        );

        console.log(
            `Allocation Test: http://localhost:${PORT}/api/allocation/test`
        );

        console.log(
            `Uploads folder: ${uploadsPath}`
        );

        console.log(
            "===================================="
        );

        console.log("");

    }
);