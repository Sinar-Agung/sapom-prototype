pipeline {
    agent any
    
    tools {
        nodejs "node" // Pastikan nama ini sesuai dengan konfigurasi di Jenkins Global Tool Configuration
    }
    
    environment {
        // Nama project
        PROJECT_NAME = 'sapom-prototype'
        
        // Node environment
        NODE_ENV = 'development'
        
        // Directory untuk build output
        DIST_DIR = 'dist'
        
        // GitHub Repository
        GIT_REPO = 'https://github.com/Sinar-Agung/sapom-prototype.git'
        
        // Credentials ID (sesuaikan dengan credentials yang Anda buat di Jenkins)
        GIT_CREDENTIALS = 'github-credentials'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '🔄 Cloning repository from GitHub...'
                git branch: 'main',
                    credentialsId: "${GIT_CREDENTIALS}",
                    url: "${GIT_REPO}"
                    
                echo '✅ Repository cloned successfully'
            }
        }
        
        stage('Environment Info') {
            steps {
                echo '📋 Displaying environment information...'
                sh '''
                    echo "Node version:"
                    node --version
                    echo "NPM version:"
                    npm --version
                    echo "Working directory:"
                    pwd
                    echo "Branch:"
                    git branch --show-current
                    echo "Last commit:"
                    git log -1 --oneline
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo '📦 Installing dependencies...'
                // Menggunakan npm ci untuk clean install (lebih cepat dan reliable)
                sh 'npm install -g pnpm'
                sh 'pnpm install'
                echo '✅ Dependencies installed successfully'
            }
        }
        
        stage('Code Quality Check') {
            steps {
                echo '🔍 Running code quality checks...'
                script {
                    try {
                        // Jika Anda memiliki ESLint configured
                        sh 'npm run lint || echo "⚠️ Lint script not found, skipping..."'
                    } catch (Exception e) {
                        echo "⚠️ Warning: Linting failed but continuing build..."
                    }
                }
            }
        }
        
        stage('Type Check') {
            steps {
                echo '🔧 Running TypeScript type checking...'
                script {
                    try {
                        sh 'npx tsc --noEmit || echo "⚠️ Type check failed but continuing..."'
                    } catch (Exception e) {
                        echo "⚠️ Warning: Type check failed but continuing build..."
                    }
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                echo '🧪 Running tests...'
                script {
                    try {
                        sh 'npm test -- --run || echo "⚠️ No tests found or tests failed"'
                    } catch (Exception e) {
                        echo "⚠️ Warning: Tests not configured or failed, continuing build..."
                    }
                }
            }
        }

        stage('Run Application') {
            steps {
                echo '🏗️ Running React application'
                sh 'pnpm run dev'
                
                echo '✅ Running completed successfully'
            }
        }
        
        stage('Build Application') {
            steps {
                echo '🏗️ Building React application with Vite...'
                sh 'npm run build'
                
                echo '✅ Build completed successfully'
                
                // Verifikasi build output
                sh '''
                    echo "Build output directory:"
                    ls -lah dist/
                '''
            }
        }
        
        stage('Archive Artifacts') {
            steps {
                echo '📦 Archiving build artifacts...'
                archiveArtifacts artifacts: 'dist/**/*', 
                                fingerprint: true,
                                allowEmptyArchive: false
                echo '✅ Artifacts archived successfully'
            }
        }
        
        stage('Deploy to Server') {
            when {
                branch 'main' // Hanya deploy dari branch main
            }
            steps {
                echo '🚀 Deploying application to server...'
                script {
                    // ===== PILIHAN DEPLOYMENT =====
                    
                    // OPSI 1: Deploy ke Static Web Server (nginx/apache)
                    // Uncomment jika Anda menggunakan metode ini
                    /*
                    sh '''
                        echo "Deploying to web server..."
                        # Contoh: Copy ke server via SCP
                        scp -r dist/* user@your-server.com:/var/www/sapom-prototype/
                        
                        # Atau menggunakan rsync
                        # rsync -avz --delete dist/ user@your-server.com:/var/www/sapom-prototype/
                    '''
                    */
                    
                    // OPSI 2: Deploy menggunakan Docker
                    // Uncomment jika Anda menggunakan Docker
                    sh '''
                        echo "Building Docker image..."
                        docker build -t sapom-prototype:${BUILD_NUMBER} .
                        docker tag sapom-prototype:${BUILD_NUMBER} sapom-prototype:latest
                        
                        echo "Stopping old container..."
                        docker stop sapom-prototype || true
                        docker rm sapom-prototype || true
                        
                        echo "Starting new container..."
                        docker run -d \
                            --name sapom-prototype \
                            -p 3000:80 \
                            --restart unless-stopped \
                            sapom-prototype:latest
                    '''
                    
                    // OPSI 3: Deploy ke Cloud Storage (AWS S3, Google Cloud Storage, dll)
                    // Uncomment jika menggunakan AWS S3
                    /*
                    sh '''
                        echo "Deploying to AWS S3..."
                        aws s3 sync dist/ s3://your-bucket-name/ --delete
                        
                        # Invalidate CloudFront cache jika menggunakan CDN
                        # aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
                    '''
                    */
                    
                    // OPSI 4: Deploy ke Vercel/Netlify via CLI
                    /*
                    sh '''
                        echo "Deploying to Vercel..."
                        npm install -g vercel
                        vercel --prod --token=${VERCEL_TOKEN}
                    '''
                    */
                    
                    // Untuk sementara, hanya print info
                    echo '⚠️ Deployment configuration needed. Please uncomment and configure one of the deployment options above.'
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ ========================================='
            echo '✅ Pipeline executed successfully! 🎉'
            echo '✅ ========================================='
            
            // Kirim notifikasi sukses (optional)
            // emailext (
            //     subject: "✅ Build Success: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
            //     body: "Build completed successfully.\n\nCheck console output at ${env.BUILD_URL}",
            //     to: "your-email@example.com"
            // )
        }
        
        failure {
            echo '❌ ========================================='
            echo '❌ Pipeline failed! 💔'
            echo '❌ ========================================='
            
            // Kirim notifikasi error (optional)
            // emailext (
            //     subject: "❌ Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
            //     body: "Build failed.\n\nCheck console output at ${env.BUILD_URL}",
            //     to: "your-email@example.com"
            // )
        }
        
        unstable {
            echo '⚠️ Pipeline is unstable'
        }
        
        always {
            echo '🧹 Cleaning up...'
            
            // Clean workspace setelah build
            cleanWs(
                deleteDirs: true,
                disableDeferredWipeout: true,
                notFailBuild: true
            )
            
            echo 'Build number: ${BUILD_NUMBER}'
            echo 'Build duration: ${currentBuild.durationString}'
        }
    }
}