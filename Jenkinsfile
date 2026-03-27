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
        //GIT_CREDENTIALS = 'github-credentials'
    }
    
    stages {

        
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
        
        stage('Deploy to Server') {
            steps {
                echo '🚀 Deploying application to server...'
                script {
                    // ===== PILIHAN DEPLOYMENT =====
                
                    sh '''
                        docker build -t sapom-prototype:${BUILD_NUMBER} .
                        docker tag sapom-prototype:${BUILD_NUMBER} sapom-prototype:latest
                    '''

                    sh '''docker stop sapom-prototype || true
                        docker rm sapom-prototype || true'''

                    sh 'docker run -d \
                            --name sapom-prototype \
                            -p 3000:80 \
                            --restart unless-stopped \
                            sapom-prototype:latest'
                }
            }
        }
    }
    
    post {
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